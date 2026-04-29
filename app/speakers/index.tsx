import { View, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function Speakers() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const { data } = useQuery({
    queryKey: ['speakers', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('speakers')
        .select('id, name, title, company, headshot_url, tags')
        .eq('event_id', eventId!)
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
        <T variant="caption" className="ml-2">Speakers</T>
      </View>
      <T variant="h1" className="mt-2">The voices of REGROWTH®</T>

      <View className="mt-6 flex-row flex-wrap -mx-1">
        {data?.map((sp) => (
          <Pressable
            key={sp.id}
            onPress={() => router.push(`/speakers/${sp.id}`)}
            className="w-1/2 px-1 mb-3"
          >
            <Card className="items-center">
              {sp.headshot_url ? (
                <Image source={{ uri: sp.headshot_url }} className="w-24 h-24 rounded-full bg-cloud" />
              ) : (
                <View className="w-24 h-24 rounded-full bg-cloud items-center justify-center">
                  <Ionicons name="person" size={36} color="#04072F" />
                </View>
              )}
              <T variant="h3" className="mt-3 text-center">{sp.name}</T>
              {(sp.title || sp.company) && (
                <T variant="small" className="mt-1 text-center">
                  {[sp.title, sp.company].filter(Boolean).join(' · ')}
                </T>
              )}
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
