import { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { T } from '@/components/Type';
import { Photo } from '@/components/Photo';
import { Monogram } from '@/components/Monogram';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoOtherAttendees } from '@/lib/demo';

const PAGE = 50;

export default function Attendees() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const meId = useAppStore((s) => s.attendee?.id);
  const [q, setQ] = useState('');

  const query = useInfiniteQuery({
    queryKey: ['attendees', eventId, q],
    enabled: !!eventId,
    initialPageParam: 0,
    getNextPageParam: (last: any[], all) => (last.length === PAGE ? all.length * PAGE : undefined),
    queryFn: async ({ pageParam }) => {
      if (IS_DEMO) {
        const ql = q.toLowerCase();
        return demoOtherAttendees.filter(
          (a) =>
            !ql ||
            a.name.toLowerCase().includes(ql) ||
            (a.role ?? '').toLowerCase().includes(ql) ||
            (a.company ?? '').toLowerCase().includes(ql),
        );
      }
      let sel = supabase
        .from('attendees')
        .select('id, name, role, company, photo_url')
        .eq('event_id', eventId!)
        .neq('visibility', 'hidden')
        .neq('id', meId!)
        .order('name')
        .range(pageParam as number, (pageParam as number) + PAGE - 1);
      if (q.length) {
        sel = sel.or(`name.ilike.%${q}%,company.ilike.%${q}%,role.ilike.%${q}%`);
      }
      const { data, error } = await sel;
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = query.data?.pages.flat() ?? [];

  return (
    <Screen scroll={false}>
      <Header label="Attendees" />
      <T variant="h1" className="mt-2">Who's here</T>

      <View className="mt-4 mb-4 bg-surface border border-line rounded-pill px-4 py-3 flex-row items-center">
        <Ionicons name="search" size={18} color="#8B8EA6" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name, role, or company"
          placeholderTextColor="#8B8EA6"
          accessibilityLabel="Search attendees"
          className="ml-3 flex-1 text-ink font-body text-body"
        />
      </View>

      <FlashList
        data={rows}
        estimatedItemSize={76}
        keyExtractor={(a: any) => a.id}
        onEndReached={() => query.hasNextPage && query.fetchNextPage()}
        onEndReachedThreshold={0.6}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: a }: { item: any }) => (
          <Pressable
            onPress={() => router.push(`/attendees/${a.id}`)}
            accessibilityRole="button"
            accessibilityLabel={a.name}
            className="bg-surface border border-line rounded-card p-4 mb-2 flex-row items-center active:bg-surface-alt"
          >
            {a.photo_url ? (
              <Photo uri={a.photo_url} width={96} className="w-12 h-12 rounded-full bg-surface-alt" />
            ) : (
              <Monogram size={48} />
            )}
            <View className="ml-3 flex-1">
              <T variant="h3">{a.name}</T>
              <T variant="small" className="text-ink-faint">
                {[a.role, a.company].filter(Boolean).join(' · ')}
              </T>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8B8EA6" />
          </Pressable>
        )}
      />
    </Screen>
  );
}
