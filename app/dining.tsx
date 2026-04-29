import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function Dining() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const me = useAppStore((s) => s.attendee);

  const { data: meals } = useQuery({
    queryKey: ['meals', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, abstract, start_at, end_at, room')
        .eq('event_id', eventId!)
        .eq('type', 'meal')
        .order('start_at');
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
        <T variant="caption" className="ml-2">Dining experience</T>
      </View>
      <T variant="h1" className="mt-2">Where we'll eat</T>

      {me?.dietary && (
        <Card className="mt-4">
          <T variant="caption">Your dietary requirements</T>
          <T variant="body" className="mt-1">{me.dietary}</T>
          <T variant="small" className="mt-2 text-cloud/70">
            Already on file from your registration. Let us know if anything's changed.
          </T>
        </Card>
      )}

      <View className="mt-6 gap-y-3">
        {meals?.map((m) => (
          <Card key={m.id}>
            <T variant="caption" className="normal-case tracking-normal text-earth">
              {new Date(m.start_at).toLocaleString()}
            </T>
            <T variant="h3" className="mt-1">{m.title}</T>
            {m.room && <T variant="small" className="mt-1">{m.room}</T>}
            {m.abstract && <T variant="body" className="mt-2 text-cloud/80">{m.abstract}</T>}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
