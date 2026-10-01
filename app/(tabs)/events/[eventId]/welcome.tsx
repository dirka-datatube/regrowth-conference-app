import { View, Text, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Backdrop } from '@/components/event/Backdrop';
import { useEvent } from '@/lib/hooks/useEvent';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { eventHref } from '@/lib/events';
import { openSupport } from '@/lib/content';
import { formatDateRange } from '@/lib/eventTime';
import { colors } from '@/lib/theme';

/**
 * Event welcome — Navigate Welcome (34:1421) / Study Tour Welcome (34:1422),
 * where GET STARTED on the hero lands: the event introduced to someone who is
 * not registered yet. The frame is a full-bleed photograph, a headline and a
 * second, smaller image inside the Events tab; its copy is not in the layer
 * data, so the words are built from the event: name, dates, venue, a line
 * about it, the way in, and — for someone not registered — the way to ask
 * about tickets.
 *
 * IMAGERY — the eDM photograph is a brand gradient (components/event/
 * Backdrop.tsx), and the second image's slot carries the dates and venue,
 * until the Sprint 12 export.
 */
export default function EventWelcome() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { event } = useEvent(eventId);
  const { isRegisteredFor } = useRegistrations();
  const registered = isRegisteredFor(eventId);

  const dates = event.startDate && event.endDate ? formatDateRange(event.startDate, event.endDate) : null;
  const copy =
    event.welcome?.body ??
    `Everything you need for ${event.short} — the programme, speakers, venue and travel details — in one place.`;

  return (
    <View className="flex-1 bg-midnight">
      <Backdrop tone="welcome" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 140 }}>
          <Pressable
            // A screen opened from a link has no history to pop; go to Events instead.
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/events'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="-ml-1 mt-2 h-10 w-10 justify-center"
          >
            <Ionicons name="chevron-back" size={24} color={colors.snow} />
          </Pressable>

          <View className="min-h-[72px] flex-1" />

          <View className="gap-y-2">
            <Text className="font-label text-[12px] font-bold tracking-[2px] text-snow/70">WELCOME TO</Text>
            <Text accessibilityRole="header" className="font-data text-hero text-snow">
              {event.title}
            </Text>
            {!!event.subtitle && <Text className="font-body text-[16px] text-snow">{event.subtitle}</Text>}
          </View>

          <View
            className="mt-7 w-[261px] max-w-full gap-y-3 rounded-badge bg-cloud px-5 py-5"
            style={{ transform: [{ rotate: '-3deg' }] }}
          >
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="calendar-outline" size={18} color={colors.midnight} />
              <Text className="flex-1 font-data text-[14px] font-semibold text-midnight">
                {dates ?? 'Dates to be announced'}
              </Text>
            </View>
            <View className="flex-row items-center gap-x-2.5">
              <Ionicons name="location-outline" size={18} color={colors.midnight} />
              <Text className="flex-1 font-data text-[14px] font-semibold text-midnight" numberOfLines={2}>
                {event.venue ?? 'Venue to be announced'}
              </Text>
            </View>
          </View>

          <Text className="mt-7 font-body text-[15px] leading-[22px] text-lede">{copy}</Text>

          <View className="mt-8 gap-y-3">
            <Pressable
              onPress={() => router.push(eventHref(eventId) as never)}
              accessibilityRole="button"
              className="h-[52px] flex-row items-center justify-center gap-x-2 rounded-pill bg-earth"
            >
              <Text className="font-data text-[15px] font-semibold text-basalt">Explore the event</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.basalt} />
            </Pressable>
            {!registered && (
              <Pressable
                onPress={openSupport}
                accessibilityRole="button"
                className="h-[52px] items-center justify-center rounded-pill border border-glass-line bg-snow/5"
              >
                <Text className="font-data text-[15px] font-semibold text-snow">Ask about tickets</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
