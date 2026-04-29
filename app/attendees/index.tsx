import { useState } from 'react';
import { View, Image, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';

export default function Attendees() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const meId = useAppStore((s) => s.attendee?.id);
  const [q, setQ] = useState('');

  const { data } = useQuery({
    queryKey: ['attendees', eventId, q],
    enabled: !!eventId,
    queryFn: async () => {
      let query = supabase
        .from('attendees')
        .select('id, name, role, company, photo_url, interests')
        .eq('event_id', eventId!)
        .neq('visibility', 'hidden')
        .neq('id', meId!)
        .order('name')
        .limit(200);
      if (q.length) {
        query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%,role.ilike.%${q}%`);
      }
      const { data, error } = await query;
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
        <T variant="caption" className="ml-2">Attendees</T>
      </View>
      <T variant="h1" className="mt-2">Who's here</T>

      <View className="mt-4 bg-snow/5 border border-snow/15 rounded-pill px-4 py-3 flex-row items-center">
        <Ionicons name="search" size={18} color="#8A8DA6" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name, role, or company"
          placeholderTextColor="#8A8DA6"
          className="ml-3 flex-1 text-snow font-body text-body"
        />
      </View>

      <View className="mt-4 gap-y-2">
        {data?.map((a) => (
          <Card key={a.id} onPress={() => router.push(`/attendees/${a.id}`)}>
            <View className="flex-row items-center">
              {a.photo_url ? (
                <Image source={{ uri: a.photo_url }} className="w-12 h-12 rounded-full bg-snow/10" />
              ) : (
                <View className="w-12 h-12 rounded-full bg-snow/10 items-center justify-center">
                  <Ionicons name="person" size={22} color="#DCD9D0" />
                </View>
              )}
              <View className="ml-3 flex-1">
                <T variant="h3">{a.name}</T>
                <T variant="small">{[a.role, a.company].filter(Boolean).join(' · ')}</T>
              </View>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
