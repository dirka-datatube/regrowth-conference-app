import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import { useDeviceCaptures } from '@/lib/recording';
import { appendPhrase } from '@/lib/transcription';
import type { Note } from '@/types/database';
import { createNote, deriveTitle, followsBody, syncNoteCaches, updateNote, type NoteRecord } from './noteData';

/**
 * The note being written: its body, a debounced autosave, and the key its
 * device captures are filed under.
 *
 * Ported from the pre-v2 new-note screen, with two changes. The row is created
 * on the first words (or the first recording or photo) rather than on open, so
 * backing out of an empty note leaves nothing behind in Insights. And every
 * write goes through one queue, so a quick edit never races the save before it.
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'locked';

export type NoteDefaults = {
  sessionId: string | null;
  sessionTitle: string | null;
  eventId: string | null;
};

export type NoteDraft = {
  noteId: string | null;
  /** The id right now — set as soon as the row exists, before a re-render. */
  currentId: () => string | null;
  body: string;
  setBody: (text: string) => void;
  /** Add a transcribed phrase to the end of the note (see appendPhrase). */
  append: (phrase: string, newParagraph: boolean) => void;
  status: SaveStatus;
  canSave: boolean;
  /** Save now, skipping the debounce. False when the note is not saved. */
  flush: () => Promise<boolean>;
  /** Create the row if there is none yet — a recording or photo needs a note to belong to. */
  ensure: (fallbackTitle: string) => Promise<string | null>;
  /** Change other columns (flags, event tag), queued behind any pending save. */
  update: (patch: Partial<Note>) => Promise<NoteRecord | null>;
  /** Where this note's device captures are filed: its id, or a draft key until it has one. */
  captureKey: string;
  captureKeyRef: { readonly current: string };
};

const DEBOUNCE_MS = 700;

export function useNoteDraft({
  initial,
  defaults,
  canSave,
  onCreated,
}: {
  initial: NoteRecord | null;
  defaults: NoteDefaults;
  canSave: boolean;
  onCreated?: (id: string) => void;
}): NoteDraft {
  const qc = useQueryClient();
  const attendeeId = useAppStore((s) => s.attendee?.id ?? null);
  const [noteId, setNoteId] = useState<string | null>(initial?.id ?? null);
  const [body, setBodyState] = useState(initial?.body ?? '');
  const [status, setStatus] = useState<SaveStatus>(canSave ? 'idle' : 'locked');
  const [draftKey] = useState(() => `draft:${Math.random().toString(36).slice(2)}`);

  const live = useRef({ qc, attendeeId, defaults, canSave, onCreated });
  useEffect(() => {
    live.current = { qc, attendeeId, defaults, canSave, onCreated };
  });

  const idRef = useRef<string | null>(initial?.id ?? null);
  const captureKeyRef = useRef(initial?.id ?? draftKey);
  // Every write goes through setBody/append, which keep this current at once,
  // so a save straight after a transcript lands never misses its last words.
  const bodyRef = useRef(body);
  const savedBody = useRef(initial?.body ?? '');
  const titleFollowsBody = useRef(followsBody(initial, defaults.sessionId));
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const persist = useCallback(
    async (fallbackTitle?: string): Promise<boolean> => {
      const { qc: client, attendeeId: owner, defaults: tag, canSave: allowed, onCreated: created } = live.current;
      if (!allowed) return false;
      const text = bodyRef.current;
      const id = idRef.current;
      if (id && text === savedBody.current) return true;
      if (!id && !text.trim() && !fallbackTitle) return true; // nothing worth keeping yet
      if (!id && !owner) return false;
      if (mounted.current) setStatus('saving');
      try {
        let note: NoteRecord;
        if (!id) {
          note = await createNote({
            attendee_id: owner!,
            session_id: tag.sessionId,
            event_id: tag.eventId,
            title: tag.sessionTitle ?? deriveTitle(text) ?? fallbackTitle ?? null,
            body: text,
          });
          idRef.current = note.id;
          captureKeyRef.current = note.id;
          useDeviceCaptures.getState().rekey(draftKey, note.id);
          if (mounted.current) setNoteId(note.id);
          created?.(note.id);
        } else {
          const patch: Partial<Note> = { body: text };
          const title = titleFollowsBody.current ? deriveTitle(text) : null;
          if (title) patch.title = title;
          note = await updateNote(id, patch);
        }
        savedBody.current = text;
        syncNoteCaches(client, note, owner);
        if (mounted.current) setStatus(bodyRef.current === text ? 'saved' : 'saving');
        return true;
      } catch {
        if (mounted.current) setStatus('error');
        return false;
      }
    },
    [draftKey],
  );

  const enqueue = useCallback(
    <T,>(job: () => Promise<T>): Promise<T> => {
      const run = queue.current.then(job);
      queue.current = run.catch(() => undefined);
      return run;
    },
    [],
  );

  const cancelTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    setStatus((s) => (canSave ? (s === 'locked' ? 'idle' : s) : 'locked'));
  }, [canSave]);

  const setBody = useCallback((text: string) => {
    bodyRef.current = text;
    setBodyState(text);
  }, []);

  const append = useCallback((phrase: string, newParagraph: boolean) => {
    const next = appendPhrase(bodyRef.current, phrase, newParagraph);
    bodyRef.current = next;
    setBodyState(next);
  }, []);

  // Debounced autosave.
  useEffect(() => {
    if (!canSave || body === savedBody.current) return;
    cancelTimer();
    timer.current = setTimeout(() => {
      timer.current = null;
      enqueue(() => persist());
    }, DEBOUNCE_MS);
  }, [body, canSave, cancelTimer, enqueue, persist]);

  // Leaving mid-debounce still saves the last words, then Insights re-reads.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelTimer();
      const saved = enqueue(() => persist());
      if (!IS_DEMO) saved.then(() => live.current.qc.invalidateQueries({ queryKey: ['notes'] }));
    };
  }, [cancelTimer, enqueue, persist]);

  const flush = useCallback(() => {
    cancelTimer();
    return enqueue(() => persist());
  }, [cancelTimer, enqueue, persist]);

  const ensure = useCallback(
    async (fallbackTitle: string) => {
      cancelTimer();
      const ok = await enqueue(() => persist(fallbackTitle));
      return ok ? idRef.current : null;
    },
    [cancelTimer, enqueue, persist],
  );

  const update = useCallback(
    (patch: Partial<Note>) =>
      enqueue(async () => {
        const id = idRef.current;
        const { qc: client, attendeeId: owner, canSave: allowed } = live.current;
        if (!id || !allowed) return null;
        const note = await updateNote(id, patch);
        syncNoteCaches(client, note, owner);
        return note;
      }),
    [enqueue],
  );

  const currentId = useCallback(() => idRef.current, []);

  return {
    noteId,
    currentId,
    body,
    setBody,
    append,
    status,
    canSave,
    flush,
    ensure,
    update,
    captureKey: noteId ?? draftKey,
    captureKeyRef,
  };
}
