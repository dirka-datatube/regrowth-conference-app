import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { NoteComposer, NoteScreenState, type CaptureMode } from '@/components/notes/NoteComposer';
import { RegistrationNotice } from '@/components/notes/Notices';
import { useNoteDraft } from '@/components/notes/useNoteDraft';
import {
  eventLabel,
  fetchNote,
  fetchSession,
  findSessionNote,
  type NoteRecord,
  type SessionInfo,
} from '@/components/notes/noteData';
import { useAppStore } from '@/lib/store';
import { useAttendee } from '@/lib/hooks/useAttendee';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { IS_DEMO, DEMO_REGISTERED } from '@/lib/demo';
import { NAVIGATE, PRODUCTS, productFor, type Product } from '@/lib/events';

/**
 * Create Note — Figma v2 "Insights Create Note Screen" (93:1081), and its
 * Audio Recording state (134:998). Full screen, no tab bar.
 *
 * Opened from Insights' capture button (`?capture=voice|video|photo`), Home and
 * Profile (`?capture=voice|photo`) and a session's "Take notes"
 * (`?session_id=`). A session note reopens the attendee's latest note on that
 * session, as the pre-v2 screen did. A new note is created with its first
 * words (or first recording or photo) and from then on the URL carries
 * `?note_id=`, so coming back — or reloading — returns to it.
 *
 * Saving needs a registration: notes belong to an attendee. Without one the
 * screen still works and says plainly that nothing is kept.
 */

type Params = { session_id?: string; capture?: string; event_id?: string; note_id?: string };
type Registration = 'checking' | 'registered' | 'unregistered' | 'signed-out';

const CAPTURE_MODES: CaptureMode[] = ['voice', 'photo', 'video'];

/** Notes belong to an attendee: the signed-in account's registration. */
function useRegistration(): { registration: Registration; attendeeId: string | null } {
  const session = useAppStore((s) => s.session);
  const stored = useAppStore((s) => s.attendee);
  // Opened from a link, the tabs layout that loads the attendee is not mounted.
  const query = useAttendee();
  const attendee = stored ?? query.data ?? null;
  if (!session) return { registration: 'signed-out', attendeeId: null };
  if (IS_DEMO) return { registration: DEMO_REGISTERED && attendee ? 'registered' : 'unregistered', attendeeId: attendee?.id ?? null };
  if (attendee) return { registration: 'registered', attendeeId: attendee.id };
  return { registration: query.isLoading ? 'checking' : 'unregistered', attendeeId: null };
}

export default function NewNote() {
  const params = useLocalSearchParams<Params>();
  // What the screen opened with. Params set later (note_id) must not reset it.
  const [opened] = useState(params);
  const { registration, attendeeId } = useRegistration();
  const { tickets } = useRegistrations();

  // The capture runs once; coming back to this screen should not repeat it.
  useEffect(() => {
    if (opened.capture) router.setParams({ capture: undefined });
  }, [opened.capture]);

  const seed = useQuery({
    queryKey: ['note-seed', opened.note_id ?? null, opened.session_id ?? null, registration, attendeeId],
    enabled: registration !== 'checking',
    staleTime: 0,
    gcTime: 0,
    retry: 1,
    queryFn: async (): Promise<{ note: NoteRecord | null; session: SessionInfo | null }> => {
      const session = opened.session_id ? await fetchSession(opened.session_id).catch(() => null) : null;
      if (registration !== 'registered') return { note: null, session };
      let note = opened.note_id ? await fetchNote(opened.note_id) : null;
      if (!note && opened.session_id && attendeeId) note = await findSessionNote(attendeeId, opened.session_id);
      return { note, session };
    },
  });

  if (registration === 'checking' || seed.isPending) return <NoteScreenState title="Create Note" />;

  // A failed lookup opens a fresh note rather than a dead end.
  const note = seed.data?.note ?? null;
  const session = seed.data?.session ?? null;
  const options = tickets
    .map((t) => productFor(t.eventId))
    .filter((p): p is Product => !!p)
    .map((p) => ({ id: p.id, label: p.short }));
  const linkedEvent = PRODUCTS.find((p) => p.id === opened.event_id)?.id;
  const initialEvent = note?.event_id ?? session?.event_id ?? linkedEvent ?? options[0]?.id ?? NAVIGATE.id;

  return (
    <CreateNote
      key={note?.id ?? 'new'}
      note={note}
      session={session}
      initialEvent={initialEvent}
      options={options}
      registration={registration}
      autoCapture={CAPTURE_MODES.find((m) => m === opened.capture) ?? null}
    />
  );
}

function CreateNote({
  note,
  session,
  initialEvent,
  options,
  registration,
  autoCapture,
}: {
  note: NoteRecord | null;
  session: SessionInfo | null;
  initialEvent: string;
  options: { id: string; label: string }[];
  registration: Registration;
  autoCapture: CaptureMode | null;
}) {
  const [eventId, setEventId] = useState(initialEvent);
  const sessionId = note?.session_id ?? session?.id ?? null;
  const sessionTitle = note?.session?.title ?? session?.title ?? null;
  const canSave = registration === 'registered';

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const draft = useNoteDraft({
    initial: note,
    defaults: { sessionId, sessionTitle, eventId },
    canSave,
    onCreated: (id) => {
      if (mounted.current) router.setParams({ note_id: id });
    },
  });

  const eventName = eventLabel(eventId, note?.event?.name) ?? NAVIGATE.short;

  function retag(id: string) {
    setEventId(id);
    draft.update({ event_id: id }).catch(() => undefined);
  }

  return (
    <NoteComposer
      headerTitle="Create Note"
      draft={draft}
      tag={{
        // The event is the title; a session note leads with the session.
        title: sessionTitle ?? eventName,
        eyebrow: sessionTitle ? eventName : null,
        options: sessionTitle ? undefined : options,
        selected: eventId,
        onSelect: retag,
      }}
      autoCapture={autoCapture}
      lockedNotice={
        canSave ? null : <RegistrationNotice signedIn={registration !== 'signed-out'} eventName={eventName} />
      }
      onDone={(id) => {
        if (id) router.replace(`/notes/${id}` as never);
        else if (router.canGoBack()) router.back();
        else router.replace('/insights' as never);
      }}
    />
  );
}
