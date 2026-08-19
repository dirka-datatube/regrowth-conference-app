import { View, Text, ScrollView, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { GlassPanel } from '@/components/Glass';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { IS_DEMO, demoEvents } from '@/lib/demo';

/**
 * Events — the product chooser.
 *
 * Spec v3 makes this the entry point to two products (Navigate, the annual
 * conference; and the REGROWTH Study Tour). The Figma file adds a third
 * category below the carousel — "Beyond Events: Courses, Workshops &
 * Programs" — which is not in the spec and is flagged as unpriced scope in
 * docs/SPEC-V3-GAP-ANALYSIS.md.
 *
 * Selecting an event sets the active product; everything downstream (agenda,
 * hotel, maps, packing, weather) is scoped to it.
 */

type EventRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  venue: string | null;
  hero_url?: string | null;
  subtitle?: string | null;
};

function EventCard({ event, width }: { event: EventRow; width: number }) {
  return (
    <GlassPanel tone="sunken" radius="rounded-card" style={{ width }} className="overflow-hidden">
      <View className="h-[420px] justify-end">
        {/* Hero. The Figma comp uses a photographic still from the last
            conference; that asset could not be exported from this environment
            (see assets/images/README.md), so the card falls back to the brand
            ground until the real image is dropped in. */}
        {event.hero_url ? (
          <Image
            source={{ uri: event.hero_url }}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="absolute inset-0 bg-ocean/30" />
        )}

        <View className="p-6">
          <Text className="font-heading text-h1 uppercase text-snow">{event.name}</Text>
          {event.subtitle && (
            <Text className="mt-1 font-heading text-h3 text-snow/90">{event.subtitle}</Text>
          )}
          <View className="mt-6">
            <Button
              label="Get started"
              onPress={() => router.push(`/agenda?event=${event.id}`)}
            />
          </View>
        </View>
      </View>
    </GlassPanel>
  );
}

export default function Events() {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 56, 340);

  const { data } = useQuery<EventRow[]>({
    queryKey: ['events'],
    queryFn: async (): Promise<EventRow[]> => {
      if (IS_DEMO) return demoEvents;
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date, end_date, venue')
        .order('start_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const events: EventRow[] = data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />

      <View className="px-5 pt-2">
        <ScreenHeader title="Events" subtitle="Choose an event to get started" back={false} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 160 }}>
        <View className="px-6 pt-6">
          <Text className="text-center font-heading text-h3 text-snow">
            Welcome to REGROWTH® events
          </Text>
          <Text className="mt-2 text-center font-body text-small text-snow/80">
            Everything you need for your event experience in one place. Explore what's coming up
            and get started.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + 16}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 28, paddingVertical: 24, columnGap: 16 }}
        >
          {events.map((e) => (
            <EventCard key={e.id} event={e} width={cardWidth} />
          ))}
        </ScrollView>

        {events.length > 1 && (
          <Text className="text-center font-body text-small text-snow/70">
            Swipe to explore your events
          </Text>
        )}

        <View className="px-5 pt-6">
          <GlassPanel tone="sunken" onPress={() => router.push('/solutions')} className="p-4">
            <View className="flex-row items-center gap-x-4">
              <View className="h-10 w-10 items-center justify-center rounded-note bg-glass">
                <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="font-data text-note-title text-snow">Beyond Events</Text>
                <Text className="mt-0.5 font-body text-note-body text-snow/80">
                  Explore courses, workshops & programs
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B9C0C9" />
            </View>
          </GlassPanel>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
