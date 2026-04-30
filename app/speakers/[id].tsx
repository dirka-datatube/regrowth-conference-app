import { View, Image, Pressable, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function SpeakerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();

  const { data: speaker } = useQuery({
    queryKey: ['speaker', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('speakers')
        .select(
          `*, sessions:session_speakers(session:sessions(id, title, abstract, start_at, end_at, room))`,
        )
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: isFollowing } = useQuery({
    queryKey: ['follows-speaker', id, attendeeId],
    enabled: !!id && !!attendeeId,
    queryFn: async () => {
      const { count } = await supabase
        .from('speaker_followers')
        .select('*', { count: 'exact', head: true })
        .eq('speaker_id', id!)
        .eq('attendee_id', attendeeId!);
      return (count ?? 0) > 0;
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!attendeeId || !id) return;
      if (isFollowing) {
        await supabase
          .from('speaker_followers')
          .delete()
          .eq('speaker_id', id)
          .eq('attendee_id', attendeeId);
      } else {
        await supabase.from('speaker_followers').insert({ speaker_id: id, attendee_id: attendeeId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follows-speaker', id, attendeeId] }),
  });

  if (!speaker) return null;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} className="pt-2">
        <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
      </Pressable>

      <View className="items-center mt-4">
        <View className="bg-cloud rounded-full p-1">
          {speaker.headshot_url ? (
            <Image source={{ uri: speaker.headshot_url }} className="w-40 h-40 rounded-full" />
          ) : (
            <View className="w-40 h-40 rounded-full bg-cloud items-center justify-center">
              <Ionicons name="person" size={64} color="#04072F" />
            </View>
          )}
        </View>
        <T variant="h1" className="mt-4 text-center">{speaker.name}</T>
        {(speaker.title || speaker.company) && (
          <T variant="body" className="mt-1 text-cloud/80 text-center">
            {[speaker.title, speaker.company].filter(Boolean).join(' · ')}
          </T>
        )}
      </View>

      <View className="flex-row gap-3 mt-6">
        <View className="flex-1">
          <Button
            label={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'ghost' : 'primary'}
            onPress={() => toggleFollow.mutate()}
          />
        </View>
        {speaker.linkedin_url && (
          <View className="flex-1">
            <Button
              label="LinkedIn"
              variant="secondary"
              onPress={() => Linking.openURL(speaker.linkedin_url!)}
            />
          </View>
        )}
      </View>

      {speaker.bio && (
        <View className="mt-8">
          <T variant="sub">About</T>
          <T variant="body" className="mt-2 text-cloud/90">{speaker.bio}</T>
        </View>
      )}

      {Array.isArray(speaker.sessions) && speaker.sessions.length > 0 && (
        <View className="mt-8">
          <T variant="sub">Sessions</T>
          <View className="mt-3 gap-y-2">
            {speaker.sessions.map((row: any) =>
              row.session ? (
                <Card key={row.session.id} onPress={() => router.push(`/session/${row.session.id}`)}>
                  <T variant="caption" className="normal-case tracking-normal text-earth">
                    {new Date(row.session.start_at).toLocaleString()}
                    {row.session.room ? ` · ${row.session.room}` : ''}
                  </T>
                  <T variant="h3" className="mt-1">{row.session.title}</T>
                </Card>
              ) : null,
            )}
          </View>
        </View>
      )}

      <View className="mt-8">
        <Button
          label="Ask a question"
          variant="ghost"
          onPress={() => router.push({ pathname: '/questions', params: { speaker_id: id } })}
        />
      </View>
    </Screen>
  );
}
