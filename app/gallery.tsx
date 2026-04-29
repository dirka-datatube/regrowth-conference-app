import { View, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function Gallery() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const { data } = useQuery({
    queryKey: ['gallery', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .eq('event_id', eventId!)
        .order('taken_at', { ascending: false })
        .limit(200);
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
        <T variant="caption" className="ml-2">Gallery</T>
      </View>
      <T variant="h1" className="mt-2">Moments</T>

      <View className="flex-row flex-wrap mt-6 -mx-1">
        {data?.map((g) => (
          <View key={g.id} className="w-1/3 p-1">
            <Image source={{ uri: g.url }} className="w-full aspect-square rounded-card bg-snow/5" />
          </View>
        ))}
      </View>
    </Screen>
  );
}
