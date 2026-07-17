import { View, Image, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function AttendeeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meId = useAppStore((s) => s.attendee?.id);
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const qc = useQueryClient();

  const { data: a } = useQuery({
    queryKey: ['attendee-public', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendees')
        .select('id, name, role, company, photo_url, bio, interests')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: connection } = useQuery({
    queryKey: ['connection', meId, id],
    enabled: !!meId && !!id,
    queryFn: async () => {
      const [a, b] = [meId!, id!].sort();
      const { data } = await supabase
        .from('connections')
        .select('id')
        .eq('attendee_a', a)
        .eq('attendee_b', b)
        .maybeSingle();
      return data;
    },
  });

  const connect = useMutation({
    mutationFn: async () => {
      if (!meId || !id || !eventId) return;
      const [a, b] = [meId, id].sort();
      const { error } = await supabase.from('connections').insert({
        event_id: eventId,
        attendee_a: a,
        attendee_b: b,
        source: 'manual',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connection', meId, id] });
      Alert.alert('Connected', `You and ${a?.name?.split(' ')[0]} are now in each other's contacts.`);
    },
    onError: (e: any) => Alert.alert('Hmm', e?.message ?? 'Try again.'),
  });

  if (!a) return null;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={10} className="pt-2">
        <Ionicons name="chevron-back" size={28} color="#04072F" />
      </Pressable>

      <View className="items-center mt-4">
        {a.photo_url ? (
          <Image source={{ uri: a.photo_url }} className="w-32 h-32 rounded-full bg-surface-alt" />
        ) : (
          <View className="w-32 h-32 rounded-full bg-surface-alt items-center justify-center">
            <Ionicons name="person" size={48} color="#8B8EA6" />
          </View>
        )}
        <T variant="h1" className="mt-4 text-center">{a.name}</T>
        {(a.role || a.company) && (
          <T variant="body" className="mt-1 text-ink-soft text-center">
            {[a.role, a.company].filter(Boolean).join(' · ')}
          </T>
        )}
      </View>

      {a.interests?.length > 0 && (
        <View className="mt-6 flex-row flex-wrap justify-center gap-2">
          {a.interests.map((tag: string) => (
            <View key={tag} className="bg-surface border border-line rounded-pill px-3 py-1">
              <T variant="caption" className="normal-case tracking-normal text-ink-soft">{tag}</T>
            </View>
          ))}
        </View>
      )}

      {a.bio && (
        <View className="mt-6">
          <T variant="sub">About</T>
          <T variant="body" className="mt-2 text-ink-soft">{a.bio}</T>
        </View>
      )}

      <View className="mt-8">
        <Button
          label={connection ? 'Connected' : 'Connect'}
          variant={connection ? 'ghost' : 'primary'}
          disabled={!!connection}
          loading={connect.isPending}
          onPress={() => connect.mutate()}
        />
      </View>
    </Screen>
  );
}
