import { useQuery, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { IS_DEMO } from '@/lib/demo';
import {
  demoCreateNote,
  demoNote,
  demoNoteForSession,
  demoNoteList,
  demoSession,
  demoSummary,
  demoUpdateNote,
} from '@/lib/demo-notes';
import { productFor } from '@/lib/events';
import type { Note } from '@/types/database';

/**
 * Note reads and writes for Create Note and the note detail. Real mode goes to
 * `notes` — the "notes self" policy scopes every row to its attendee — and
 * demo mode to lib/demo-notes.
 */

export type NoteRecord = Note & {
  session: { id: string; title: string } | null;
  event: { id: string; name: string } | null;
};

export type SessionInfo = { id: string; title: string; event_id: string };

const COLUMNS =
  'id, attendee_id, session_id, event_id, title, body, pinned, important, reminder_at, ai_summary, ai_summary_generated_at, follow_up_questions, created_at, updated_at, session:sessions(id, title), event:events(id, name)';

/** The Insights list, as app/(tabs)/insights.tsx keys it. */
function insightsKey(attendeeId: string | null | undefined) {
  return ['notes', attendeeId ?? undefined];
}

/** A note already in the query cache — the Insights list, or an earlier read. */
function cachedNote(id: string): NoteRecord | undefined {
  for (const [, rows] of queryClient.getQueriesData<NoteRecord[]>({ queryKey: ['notes'] })) {
    const hit = Array.isArray(rows) ? rows.find((r) => r.id === id) : undefined;
    if (hit) return { ...hit, session: hit.session ?? null, event: hit.event ?? null };
  }
  return queryClient.getQueryData<NoteRecord | null>(['note', id]) ?? undefined;
}

export async function fetchNote(id: string): Promise<NoteRecord | null> {
  // A demo note made before a reload survives only in the persisted cache.
  if (IS_DEMO) return demoNote(id) ?? cachedNote(id) ?? null;
  const { data, error } = await supabase.from('notes').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as NoteRecord | null;
}

/** The attendee's latest note on a session — "Take notes" reopens it. */
export async function findSessionNote(attendeeId: string, sessionId: string): Promise<NoteRecord | null> {
  if (IS_DEMO) return demoNoteForSession(sessionId) ?? null;
  const { data, error } = await supabase
    .from('notes')
    .select(COLUMNS)
    .eq('attendee_id', attendeeId)
    .eq('session_id', sessionId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as NoteRecord | null;
}

export async function fetchSession(sessionId: string): Promise<SessionInfo | null> {
  if (IS_DEMO) return demoSession(sessionId) ?? null;
  const { data, error } = await supabase.from('sessions').select('id, title, event_id').eq('id', sessionId).maybeSingle();
  if (error) throw error;
  return data as unknown as SessionInfo | null;
}

export async function createNote(
  fields: Pick<Note, 'attendee_id' | 'session_id' | 'event_id' | 'title' | 'body'>,
): Promise<NoteRecord> {
  if (IS_DEMO) return demoCreateNote(fields);
  // types/database.ts predates supabase-js's schema shape, which types insert() as `never`.
  const { data, error } = await supabase.from('notes').insert(fields as never).select(COLUMNS).single();
  if (error) throw error;
  return data as unknown as NoteRecord;
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<NoteRecord> {
  if (IS_DEMO) return demoUpdateNote(id, patch, cachedNote(id));
  // As createNote: update() is typed `never` until the database types are regenerated.
  const { data, error } = await supabase.from('notes').update(patch as never).eq('id', id).select(COLUMNS).single();
  if (error) throw error;
  return data as unknown as NoteRecord;
}

/**
 * The AI summary and follow-up questions, from the claude-summarise-notes edge
 * function (which writes them to the row); demo mode fakes a short wait and a
 * canned summary.
 */
export async function summariseNote(note: { id: string; body: string; eventName: string }): Promise<NoteRecord> {
  if (IS_DEMO) {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const { summary, follow_up_questions } = demoSummary(note.body, note.eventName);
    return updateNote(note.id, {
      ai_summary: summary,
      follow_up_questions,
      ai_summary_generated_at: new Date().toISOString(),
    });
  }
  const { data, error } = await supabase.functions.invoke('claude-summarise-notes', { body: { note_id: note.id } });
  if (error) throw error;
  if ((data as { error?: unknown } | null)?.error) throw new Error('Summary failed');
  const fresh = await fetchNote(note.id);
  if (!fresh) throw new Error('Note not found');
  return fresh;
}

/**
 * After a save: the note's own cache entry, and its card at the top of the
 * Insights list (newest first, as the real query orders it). Demo data never
 * changes underneath, so in demo Insights keeps what was saved here instead of
 * refetching the fixtures.
 */
export function syncNoteCaches(qc: QueryClient, note: NoteRecord, attendeeId: string | null | undefined) {
  qc.setQueryData(['note', note.id], note);
  if (IS_DEMO) qc.setQueryDefaults(['notes'], { staleTime: Infinity });
  qc.setQueryData<NoteRecord[]>(insightsKey(attendeeId), (rows: NoteRecord[] | undefined) => {
    const list = rows ?? (IS_DEMO ? demoNoteList() : undefined);
    if (!list) return rows; // not loaded yet: Insights reads fresh when it opens
    const previous = list.find((r: NoteRecord) => r.id === note.id);
    const row = { ...note, event: note.event ?? previous?.event ?? null };
    return [row, ...list.filter((r: NoteRecord) => r.id !== note.id)];
  });
}

/** One note, fresh from the server each time the detail opens. */
export function useNoteRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['note', id],
    enabled: !!id,
    queryFn: () => fetchNote(id!),
    staleTime: 0,
    retry: 1,
  });
}

/** The event tag as the comps set it — "Navigate 2027". */
export function eventLabel(eventId: string | null | undefined, fallbackName?: string | null): string | null {
  return (eventId ? productFor(eventId)?.short : undefined) ?? fallbackName ?? null;
}

/**
 * A card title from the note itself: its first sentence, or as much of its
 * first line as fits on an Insights card.
 */
export function deriveTitle(body: string): string | null {
  const line = body
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean);
  if (!line) return null;
  const sentence = (line.match(/^.+?[.!?](\s|$)/)?.[0] ?? line).trim().replace(/[.!?]+$/, '');
  if (sentence.length <= 48) return sentence;
  const cut = sentence.slice(0, 48);
  const space = cut.lastIndexOf(' ');
  return `${(space > 24 ? cut.slice(0, space) : cut).trim()}…`;
}

/**
 * Whether the title follows the note's first sentence as it is edited. A
 * session note keeps the session's name; a title someone chose is kept.
 */
export function followsBody(note: Pick<Note, 'title' | 'body' | 'session_id'> | null, sessionId: string | null) {
  if (!note) return !sessionId;
  if (note.session_id) return false;
  return !note.title || !note.body.trim() || note.title === deriveTitle(note.body);
}
