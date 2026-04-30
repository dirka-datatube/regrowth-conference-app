import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoNotes } from '@/lib/demo';

export default function Notes() {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const { data } = useQuery({
    queryKey: ['notes', attendeeId],
    enabled: !!attendeeId,
    queryFn: async () => {
      if (IS_DEMO) return demoNotes;
      const { data, error } = await supabase
        .from('notes')
        .select(`id, body, ai_summary, updated_at, session:sessions(id, title, start_at)`)
        .eq('attendee_id', attendeeId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Screen>
      <View className="pt-2">
        <T variant="caption">Event notes</T>
        <T variant="h1" className="mt-2">Your thinking</T>
        <T variant="body" className="mt-2 text-cloud/80">
          Everything you've captured, plus the AI summary we'll build for each session.
        </T>
      </View>

      <View className="mt-6 gap-y-3">
        {data?.length ? (
          data.map((n: any) => (
            <Card key={n.id} onPress={() => router.push(`/notes/${n.id}`)}>
              <T variant="caption" className="normal-case tracking-normal text-earth">
                {n.session?.title ?? 'Untitled session'}
              </T>
              <T variant="body" className="mt-2 text-snow" numberOfLines={3}>
                {n.body || '(no notes yet)'}
              </T>
              {n.ai_summary && (
                <T variant="small" className="mt-2 text-cloud/70" numberOfLines={2}>
                  ✨ {n.ai_summary}
                </T>
              )}
            </Card>
          ))
        ) : (
          <EmptyState
            title="Nothing captured yet"
            description="Open a session and start taking notes — we'll summarise them for you afterwards."
            cta={<Button label="Browse the agenda" onPress={() => router.push('/(tabs)/agenda')} />}
          />
        )}
      </View>
    </Screen>
  );
}
