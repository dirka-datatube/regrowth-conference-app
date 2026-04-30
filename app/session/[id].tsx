import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['session', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`*, speakers:session_speakers(speaker:speakers(id, name, headshot_url, title))`)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: picked } = useQuery({
    queryKey: ['picked', id, attendeeId],
    enabled: !!id && !!attendeeId,
    queryFn: async () => {
      const { count } = await supabase
        .from('schedule_picks')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', id!)
        .eq('attendee_id', attendeeId!);
      return (count ?? 0) > 0;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!attendeeId || !id) return;
      if (picked) {
        await supabase.from('schedule_picks').delete().eq('attendee_id', attendeeId).eq('session_id', id);
      } else {
        await supabase.from('schedule_picks').insert({ attendee_id: attendeeId, session_id: id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['picked', id, attendeeId] }),
  });

  if (!session) return null;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} className="pt-2">
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
      </Pressable>

      <View className="mt-4">
        <T variant="caption" className="text-earth normal-case tracking-normal">
          {new Date(session.start_at).toLocaleString()}
          {session.room ? ` · ${session.room}` : ''}
        </T>
        <T variant="h1" className="mt-2">{session.title}</T>
      </View>

      {session.abstract && (
        <View className="mt-4">
          <T variant="body" className="text-cloud/90">{session.abstract}</T>
        </View>
      )}

      {Array.isArray(session.speakers) && session.speakers.length > 0 && (
        <View className="mt-6">
          <T variant="sub">Speakers</T>
          <View className="mt-3 gap-y-2">
            {session.speakers.map((row: any) =>
              row.speaker ? (
                <Card key={row.speaker.id} onPress={() => router.push(`/speakers/${row.speaker.id}`)}>
                  <T variant="h3">{row.speaker.name}</T>
                  {row.speaker.title && <T variant="small">{row.speaker.title}</T>}
                </Card>
              ) : null,
            )}
          </View>
        </View>
      )}

      <View className="mt-8 gap-y-3">
        <Button
          label={picked ? 'In your schedule' : 'Add to my schedule'}
          variant={picked ? 'ghost' : 'primary'}
          onPress={() => toggle.mutate()}
        />
        <Button
          label="Take notes"
          variant="secondary"
          onPress={() => router.push({ pathname: '/notes/new', params: { session_id: id } })}
        />
        <Button
          label="Submit a question"
          variant="ghost"
          onPress={() => router.push({ pathname: '/questions', params: { session_id: id } })}
        />
      </View>
    </Screen>
  );
}
