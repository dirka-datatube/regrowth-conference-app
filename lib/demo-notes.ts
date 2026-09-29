import type { Note } from '@/types/database';
import { demoAttendee, demoEvents, demoNotes, demoSessions } from '@/lib/demo';
import { demoAgenda } from '@/lib/demo-event';
import { PRODUCTS } from '@/lib/events';

/**
 * Demo mode for note capture — Create Note (93:1081), Audio Recording
 * (134:998) and the note detail — with no backend.
 *
 * Saves land in memory for as long as the page is open: notes made in the
 * demo sit in front of the shared `demoNotes` fixtures, and edits to those
 * fixtures are kept here, so `@/lib/demo` itself is never changed. The AI
 * summary is canned, and the scripted transcript types itself out where the
 * browser has no speech engine.
 */

export type DemoNote = Note & {
  session: { id: string; title: string } | null;
  event: { id: string; name: string } | null;
};

function eventRef(eventId: string | null): DemoNote['event'] {
  const ev = demoEvents.find((e) => e.id === eventId);
  return ev ? { id: ev.id, name: ev.name } : null;
}

/**
 * A demo session by id: the event guide's agenda first (what "Take notes" on
 * a session opens from), then the older shared fixtures.
 */
export function demoSession(sessionId: string): { id: string; title: string; event_id: string } | undefined {
  for (const product of PRODUCTS) {
    const s = demoAgenda(product.id).find((x) => x.id === sessionId);
    if (s) return { id: s.id, title: s.title, event_id: product.id };
  }
  const s = demoSessions.find((x) => x.id === sessionId);
  return s ? { id: s.id, title: s.title, event_id: s.event_id } : undefined;
}

function sessionRef(sessionId: string | null): DemoNote['session'] {
  const s = sessionId ? demoSession(sessionId) : undefined;
  return s ? { id: s.id, title: s.title } : null;
}

const created: DemoNote[] = [];
const edited = new Map<string, DemoNote>();

function fixtures(): DemoNote[] {
  return demoNotes.map(
    (n) =>
      edited.get(n.id) ?? {
        ...n,
        session: n.session ? { id: n.session.id, title: n.session.title } : null,
        event: eventRef(n.event_id),
      },
  );
}

/** Every demo note: the ones made in this demo first, then the fixtures. */
export function demoNoteList(): DemoNote[] {
  return [...created, ...fixtures()];
}

export function demoNote(id: string): DemoNote | undefined {
  return created.find((n) => n.id === id) ?? edited.get(id) ?? fixtures().find((n) => n.id === id);
}

export function demoNoteForSession(sessionId: string): DemoNote | undefined {
  return demoNoteList().find((n) => n.session_id === sessionId);
}

export function demoCreateNote(fields: Partial<Note>): DemoNote {
  const now = new Date().toISOString();
  const note: DemoNote = {
    id: `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    attendee_id: fields.attendee_id ?? demoAttendee.id,
    session_id: fields.session_id ?? null,
    event_id: fields.event_id ?? null,
    title: fields.title ?? null,
    body: fields.body ?? '',
    pinned: false,
    important: false,
    reminder_at: null,
    ai_summary: null,
    ai_summary_generated_at: null,
    follow_up_questions: [],
    created_at: now,
    updated_at: now,
    session: sessionRef(fields.session_id ?? null),
    event: eventRef(fields.event_id ?? null),
  };
  created.unshift(note);
  return note;
}

/**
 * `base` covers a note this page did not make — one restored from the cached
 * Insights list after a reload.
 */
export function demoUpdateNote(id: string, patch: Partial<Note>, base?: DemoNote): DemoNote {
  const current = demoNote(id) ?? base;
  if (!current) throw new Error('This demo note is no longer available.');
  const next: DemoNote = { ...current, ...patch, updated_at: new Date().toISOString() };
  if (patch.event_id !== undefined) next.event = eventRef(patch.event_id);
  const i = created.findIndex((n) => n.id === id);
  if (i >= 0) created[i] = next;
  else edited.set(id, next);
  return next;
}

function firstSentence(body: string): string | null {
  const text = body.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const sentence = text.match(/^.+?[.!?](\s|$)/)?.[0].trim() ?? text;
  return sentence.length > 140 ? `${sentence.slice(0, 137).trim()}…` : sentence;
}

/**
 * Stands in for the claude-summarise-notes edge function, in the voice its
 * prompt asks for: "we", solutions-focused, 3 follow-up questions.
 */
export function demoSummary(body: string, eventName: string) {
  const lead = firstSentence(body);
  return {
    summary: [
      lead
        ? `We captured the key ideas from ${eventName}, starting with: “${lead}”`
        : `We captured the key ideas from ${eventName}.`,
      'The through-line is consistency: small habits, protected every week, compound into trust with clients and within the team.',
      'Our opportunity now is to choose one habit to protect this quarter, share it with the team, and review it together each Monday.',
    ].join('\n\n'),
    follow_up_questions: [
      'Which one habit will we protect every week this quarter?',
      'Who on the team should hear this idea first, and when?',
      'How will we know in 30 days that it is working?',
    ],
  };
}

/** A keynote that types itself out when the browser cannot transcribe. */
export const DEMO_TRANSCRIPT: readonly string[] = [
  'Welcome back, everyone.',
  'This morning is about consistency over intensity.',
  'The best teams we coach protect three habits: a weekly one-on-one that never moves, a Monday number everyone can recite, and a follow-up rhythm that survives a bad week.',
  'Ask for the referral at the appraisal, not at settlement — by settlement the emotional peak has passed.',
  'Pick one habit to protect this quarter, and tell someone on your team today.',
  'Small habits, protected every week, compound into trust.',
];
