import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Chip } from '@/components/Chip';
import { SearchField } from '@/components/SearchField';
import { GlassPanel } from '@/components/Glass';
import { Fab, type CaptureMode } from '@/components/Fab';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoNotes, demoEvents } from '@/lib/demo';
import { canRecordInBackground, needsNativeApp, nativeAppLink } from '@/lib/capture';
import type { Note } from '@/types/database';

type Filter = 'all' | 'recent' | 'pinned';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recent', label: 'Recently Viewed' },
  { key: 'pinned', label: 'Pinned' },
];

type NoteRow = Note & { event: { id: string; name: string } | null };

/** Meta row under each note: event tag, Important, Reminder. */
function Meta({
  icon,
  label,
  shrink,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  shrink?: boolean;
}) {
  return (
    <View className={`flex-row items-center gap-x-1.5 ${shrink ? 'shrink' : ''}`}>
      <Ionicons name={icon} size={12} color="#B9C0C9" />
      <Text className="font-data text-meta text-snow" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function NoteCard({ note, onTogglePin }: { note: NoteRow; onTogglePin?: () => void }) {
  return (
    <GlassPanel tone="sunken" onPress={() => router.push(`/notes/${note.id}`)} className="p-[18px]">
      <View className="flex-row items-start">
        <Text className="flex-1 font-data text-note-title text-snow" numberOfLines={1}>
          {note.title || 'Untitled note'}
        </Text>
        <Pressable
          onPress={onTogglePin}
          hitSlop={10}
          accessibilityLabel={note.pinned ? 'Unpin this note' : 'Pin this note'}
        >
          <Ionicons
            name={note.pinned ? 'heart' : 'heart-outline'}
            size={22}
            color={note.pinned ? '#FFFFFF' : '#B9C0C9'}
          />
        </Pressable>
      </View>

      <Text className="mt-2.5 font-body text-note-body text-snow/90" numberOfLines={4}>
        {note.body || '(no notes yet)'}
      </Text>

      <View className="mt-3 flex-row items-center gap-x-5">
        {note.event?.name && <Meta icon="pricetag-outline" label={note.event.name} shrink />}
        {note.important && <Meta icon="filter-outline" label="Important" />}
        {note.reminder_at && <Meta icon="alarm-outline" label="Reminder" />}
      </View>
    </GlassPanel>
  );
}

export default function Insights() {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const [filter, setFilter] = useState<Filter>('all');
  // Home's search field hands its query over as ?q=.
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  useEffect(() => {
    if (params.q !== undefined) setQ(params.q);
  }, [params.q]);

  const { data } = useQuery<NoteRow[]>({
    queryKey: ['notes', attendeeId],
    enabled: !!attendeeId || IS_DEMO,
    queryFn: async (): Promise<NoteRow[]> => {
      if (IS_DEMO) {
        return demoNotes.map((n) => {
          const ev = demoEvents.find((e) => e.id === n.event_id);
          return { ...n, event: ev ? { id: ev.id, name: ev.name } : null };
        }) as NoteRow[];
      }
      const { data, error } = await supabase
        .from('notes')
        .select(
          'id, title, body, ai_summary, pinned, important, reminder_at, event_id, session_id, updated_at, created_at, attendee_id, ai_summary_generated_at, follow_up_questions, event:events(id, name)',
        )
        .eq('attendee_id', attendeeId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as NoteRow[];
    },
  });

  const notes = useMemo(() => {
    let rows: NoteRow[] = data ?? [];
    if (filter === 'pinned') rows = rows.filter((n) => n.pinned);
    // "Recently Viewed" is a stand-in until note_views lands — see the sprint
    // doc. Ordering is already newest-first, so this is the most recent slice.
    if (filter === 'recent') rows = rows.slice(0, 5);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      rows = rows.filter(
        (n) =>
          (n.title ?? '').toLowerCase().includes(needle) ||
          (n.body ?? '').toLowerCase().includes(needle),
      );
    }
    return rows;
  }, [data, filter, q]);

  function onCapture(mode: CaptureMode) {
    router.push(mode === 'note' ? '/notes/new' : `/notes/new?capture=${mode}`);
  }

  // Recording needs the native build to survive a locked screen. Rather than
  // hiding it in the browser, send people to the app.
  const recordingIsNativeOnly = needsNativeApp();

  function onNeedsApp() {
    router.push(nativeAppLink() as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />

      <View className="px-5 pt-2">
        <ScreenHeader title="Insights" subtitle="Keep all your event notes in one place" />
      </View>

      <View className="flex-row items-center gap-x-2 px-5 pt-4">
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      <View className="px-3.5 pt-4">
        <SearchField
          value={q}
          onChangeText={setQ}
          onVoice={() => (recordingIsNativeOnly ? onNeedsApp() : onCapture('voice'))}
          voiceAvailable={canRecordInBackground() !== 'unsupported' || recordingIsNativeOnly}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 160, rowGap: 9 }}
      >
        {notes.length ? (
          notes.map((n) => <NoteCard key={n.id} note={n} />)
        ) : (
          <EmptyState
            title={q ? 'Nothing matches that' : 'No notes yet'}
            description={
              q
                ? 'Try a different word, or clear the search to see everything.'
                : 'Capture a thought during a session and it will land here.'
            }
          />
        )}
      </ScrollView>

      <Fab
        onCapture={onCapture}
        nativeOnlyModes={recordingIsNativeOnly ? ['voice', 'video'] : []}
        onNeedsApp={onNeedsApp}
      />
    </SafeAreaView>
  );
}
