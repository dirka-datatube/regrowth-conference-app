import { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoPartners } from '@/lib/demo';

const FILTERS = ['all', 'recruitment', 'tech', 'marketing', 'banking', 'training'] as const;
type Filter = (typeof FILTERS)[number];

// Curated partner offerings tagged by problem (recruitment, tech, marketing,
// etc.). Filter by attendee role.
export default function Solutions() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  const [filter, setFilter] = useState<Filter>('all');

  const { data: partners } = useQuery({
    queryKey: ['partners-solutions', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (IS_DEMO) return demoPartners;
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, description, solutions_content, tags')
        .eq('event_id', eventId!)
        .not('solutions_content', 'is', null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!partners) return [];
    if (filter === 'all') return partners;
    return partners.filter((p) => p.tags?.includes(filter));
  }, [partners, filter]);

  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">Solutions</T>
      </View>
      <T variant="h1" className="mt-2">Solutions for your business</T>

      <View className="flex-row flex-wrap gap-2 mt-4">
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`rounded-pill px-3 py-1 ${filter === f ? 'bg-earth' : 'bg-snow/5 border border-snow/15'}`}
          >
            <T variant="caption" className={`normal-case tracking-normal ${filter === f ? 'text-snow' : 'text-cloud'}`}>
              {f}
            </T>
          </Pressable>
        ))}
      </View>

      <View className="mt-6 gap-y-3">
        {filtered.map((p) => (
          <Card key={p.id} onPress={() => router.push(`/partners/${p.id}`)}>
            <T variant="h3">{p.name}</T>
            {p.description && <T variant="body" className="mt-1 text-cloud/80" numberOfLines={2}>{p.description}</T>}
            {p.solutions_content && (
              <T variant="small" className="mt-3 text-cloud/70" numberOfLines={3}>
                {p.solutions_content}
              </T>
            )}
          </Card>
        ))}
      </View>
    </Screen>
  );
}
