import { View, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoPodcast } from '@/lib/demo';

export default function Podcast() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const { data } = useQuery({
    queryKey: ['podcast', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (IS_DEMO) return demoPodcast;
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('*')
        .eq('event_id', eventId!)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">Podcast</T>
      </View>
      <T variant="h1" className="mt-2">Impact & Influence</T>
      <T variant="body" className="mt-2 text-cloud/80">
        Conversations with the people moving real estate forward.
      </T>

      <View className="mt-6 gap-y-3">
        {data?.map((ep) => (
          <Card key={ep.id} onPress={() => ep.episode_url && Linking.openURL(ep.episode_url)}>
            <T variant="caption" className="normal-case tracking-normal text-earth">
              {new Date(ep.published_at).toLocaleDateString()}
            </T>
            <T variant="h3" className="mt-1">{ep.title}</T>
            {ep.description && (
              <T variant="body" className="mt-2 text-cloud/80" numberOfLines={3}>{ep.description}</T>
            )}
            <View className="flex-row mt-3 gap-3">
              {ep.audio_url && (
                <Pressable
                  onPress={() => Linking.openURL(ep.audio_url)}
                  className="bg-earth rounded-pill px-4 py-2 flex-row items-center"
                >
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                  <T variant="small" className="ml-2 text-snow font-sub uppercase tracking-widest">
                    Listen
                  </T>
                </Pressable>
              )}
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
