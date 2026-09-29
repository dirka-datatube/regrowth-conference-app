import { useState } from 'react';
import { Platform, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { FooterButton, NoteComposer, NoteScreenState } from '@/components/notes/NoteComposer';
import { NoteFlags, type NoteFlagValues } from '@/components/notes/NoteFlags';
import { SummarySection } from '@/components/notes/SummarySection';
import { useNoteDraft } from '@/components/notes/useNoteDraft';
import {
  eventLabel,
  summariseNote,
  syncNoteCaches,
  useNoteRecord,
  type NoteRecord,
} from '@/components/notes/noteData';
import { useAppStore } from '@/lib/store';
import { useAttendee } from '@/lib/hooks/useAttendee';
import { IS_DEMO } from '@/lib/demo';

/**
 * Note detail — no frame of its own, so it is built in the Create Note chrome
 * (93:1081): the event tag as the title, the note (editable, autosaved), then
 * the three states an Insights card shows (80:1892: heart = pinned,
 * Important, Reminder), the AI summary in a tile card and its follow-up
 * questions. Re-check against a detail frame when one is designed.
 *
 * Demo mode opens the `demoNotes` fixtures and anything made in the demo.
 */

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/insights' as never);
}

export default function NoteDetail() {
  useAttendee(); // opened from a link, the tabs layout that loads the attendee is not mounted
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useNoteRecord(id);

  // Wait for a fresh read before the editor takes the body, so an older cached
  // copy can never be saved over newer words.
  if (id && !query.isFetchedAfterMount && !query.isError) return <NoteScreenState title="Your Note" />;
  if (!query.data) {
    return (
      <NoteScreenState
        title="Your Note"
        message="This note isn’t available. It may have been deleted, or it belongs to another account."
        action={{ label: 'Back to Insights', onPress: () => router.replace('/insights' as never) }}
      />
    );
  }
  return <NoteDetailEditor key={query.data.id} note={query.data} />;
}

function NoteDetailEditor({ note }: { note: NoteRecord }) {
  const qc = useQueryClient();
  const attendeeId = useAppStore((s) => s.attendee?.id ?? null);
  // Only the owner can read a note (RLS), so an open note is always theirs.
  const canSave = IS_DEMO || !!attendeeId;

  const draft = useNoteDraft({
    initial: note,
    defaults: { sessionId: note.session_id, sessionTitle: note.session?.title ?? null, eventId: note.event_id },
    canSave,
  });

  const [flags, setFlags] = useState<NoteFlagValues>({
    pinned: note.pinned,
    important: note.important,
    reminder_at: note.reminder_at,
  });
  const [flagError, setFlagError] = useState<string | null>(null);
  const [ai, setAi] = useState({
    summary: note.ai_summary,
    questions: note.follow_up_questions ?? [],
    at: note.ai_summary_generated_at,
  });
  const [summarising, setSummarising] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const eventName = eventLabel(note.event_id, note.event?.name);
  const sessionTitle = note.session?.title ?? null;

  async function changeFlags(patch: Partial<NoteFlagValues>) {
    const before = flags;
    setFlags({ ...flags, ...patch });
    setFlagError(null);
    try {
      if (!(await draft.update(patch))) throw new Error('Not saved');
    } catch {
      setFlags(before);
      setFlagError('That change was not saved. Check your connection and try again.');
    }
  }

  async function summarise() {
    setSummarising(true);
    setAiError(null);
    try {
      // The edge function reads the saved note, so save the latest words first.
      const id = (await draft.flush()) ? draft.currentId() : null;
      if (!id) throw new Error('Not saved');
      const fresh = await summariseNote({ id, body: draft.body, eventName: eventName ?? 'the session' });
      syncNoteCaches(qc, fresh, attendeeId);
      setAi({ summary: fresh.ai_summary, questions: fresh.follow_up_questions ?? [], at: fresh.ai_summary_generated_at });
    } catch {
      setAiError('The summary is not available right now. Try again in a moment.');
    } finally {
      setSummarising(false);
    }
  }

  const canShare =
    Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  function share() {
    const title = note.title || sessionTitle || 'Session notes';
    Share.share({
      title,
      message: [title, '', draft.body, ai.summary ? `\nSummary:\n${ai.summary}` : ''].join('\n'),
    }).catch(() => undefined);
  }

  return (
    <NoteComposer
      headerTitle={note.title || 'Untitled note'}
      draft={draft}
      tag={{ title: sessionTitle ?? eventName ?? 'Your note', eyebrow: sessionTitle ? eventName : null }}
      beforeBody={<NoteFlags value={flags} onChange={changeFlags} error={flagError} />}
      footerStart={canShare ? <FooterButton icon="share-outline" label="Share this note" onPress={share} /> : null}
      onDone={leave}
    >
      <SummarySection
        summary={ai.summary}
        questions={ai.questions}
        generatedAt={ai.at}
        busy={summarising}
        error={aiError}
        canSummarise={canSave && !!draft.body.trim()}
        onSummarise={summarise}
      />
    </NoteComposer>
  );
}
