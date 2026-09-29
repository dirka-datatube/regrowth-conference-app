import { View, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoPartners } from '@/lib/demo';

export default function Partners() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const { data } = useQuery({
    queryKey: ['partners', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (IS_DEMO) return demoPartners;
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, logo_url, description, is_featured, tags')
        .eq('event_id', eventId!)
        .order('is_featured', { ascending: false })
        .order('display_order')
        .order('name');
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
        <T variant="caption" className="ml-2">Partners</T>
      </View>
      <T variant="h1" className="mt-2">The brands powering REGROWTH®</T>

      <View className="mt-6 gap-y-3">
        {data?.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/partners/${p.id}`)}>
            <View className="flex-row items-center">
              {p.logo_url ? (
                <Image
                  source={{ uri: p.logo_url }}
                  className="w-16 h-16 rounded-card bg-cloud"
                  resizeMode="contain"
                />
              ) : (
                <View className="w-16 h-16 rounded-card bg-cloud items-center justify-center">
                  <Ionicons name="business" size={28} color="#04072F" />
                </View>
              )}
              <View className="ml-4 flex-1">
                <T variant="h3">{p.name}</T>
                {p.description && (
                  <T variant="small" numberOfLines={2} className="mt-1">{p.description}</T>
                )}
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
