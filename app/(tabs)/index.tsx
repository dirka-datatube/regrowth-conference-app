import { useState } from 'react';
import { View, Text, Image, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { TabScreen, Section } from '@/components/TabScreen';
import { SearchField } from '@/components/SearchField';
import { EventHeroPager } from '@/components/EventHeroPager';
import { SectionHeading } from '@/components/SectionHeading';
import { QuickAccessGrid, type QuickAccessItem } from '@/components/QuickAccessGrid';
import { FeaturedRow } from '@/components/FeaturedRow';
import { NeedHelp } from '@/components/NeedHelp';
import { ContinueLearning } from '@/components/ContinueLearning';
import { useAppStore } from '@/lib/store';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { firstName } from '@/lib/hooks/useProfile';
import { NAVIGATE, PRODUCTS, eventHref } from '@/lib/events';
import { FEATURED } from '@/lib/content';
import { canRecordInBackground, needsNativeApp, nativeAppLink } from '@/lib/capture';
import { colors } from '@/lib/theme';

/**
 * Home — Figma v2 "Home Page Navigate" (3:1921) and its REGISTERED variant
 * (132:598).
 *
 * The hero leads with the event the attendee is registered for, and swipes to
 * the other — the Navigate comps and their Study Tour variants (172:526 /
 * 180:588) in one screen. Registration decides each hero's badge and call to
 * action.
 *
 * August's live panels (happening now, up next) moved to the event home's
 * What's Coming feed (lib/hooks/useEventFeed.ts), where the comp puts them.
 */

const QUICK_ACCESS: QuickAccessItem[] = [
  { label: 'Alerts', icon: 'mail-outline', href: '/alerts' },
  { label: 'Events', icon: 'calendar-outline', href: '/events' },
  { label: 'Insights', icon: 'bulb-outline', href: '/insights' },
  { label: 'Connect', icon: 'people-outline', href: '/connect' },
  { label: 'Your Profile', icon: 'person-outline', href: '/me' },
  { label: 'Weather', icon: 'rainy-outline', href: eventHref(NAVIGATE.id, 'weather') },
];

export default function Home() {
  const attendee = useAppStore((s) => s.attendee);
  const { isRegisteredFor } = useRegistrations();
  // The event you hold a ticket for leads (Home ST variants, 172:526 / 180:588).
  const heroes = [...PRODUCTS].sort((a, b) => Number(isRegisteredFor(b.id)) - Number(isRegisteredFor(a.id)));
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');

  async function refresh() {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  }

  const profile = useAppStore((s) => s.profile);
  const first = firstName(profile, attendee) || 'there';

  // The only searchable content the app holds today is the attendee's own
  // notes, so Home search hands off to Insights rather than pretending to be
  // a global search.
  function search() {
    const query = q.trim();
    router.navigate({ pathname: '/insights', params: query ? { q: query } : {} });
  }

  // Dictation records audio, which needs the native app to survive a locked
  // screen — same rule as the Insights capture button.
  const recordingIsNativeOnly = needsNativeApp();
  function onVoice() {
    router.push((recordingIsNativeOnly ? nativeAppLink() : '/notes/new?capture=voice') as never);
  }

  return (
    <TabScreen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.earth} />}
      header={
        <View className="flex-row items-center gap-x-3.5 pb-1 pt-2">
          {attendee?.photo_url ? (
            <Image
              source={{ uri: attendee.photo_url }}
              className="h-[46px] w-[47px] rounded-pill"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View className="h-[46px] w-[47px] items-center justify-center rounded-pill bg-glass">
              <Ionicons name="person" size={22} color={colors.snow} />
            </View>
          )}
          <View className="flex-1">
            <Text className="font-data text-[20px] text-snow" numberOfLines={1}>
              Hello, {first}
            </Text>
            <Text className="mt-1 font-body text-[13px] text-snow">Welcome to REGROWTH</Text>
          </View>
        </View>
      }
    >
      <Section>
        <SearchField
          value={q}
          onChangeText={setQ}
          onSubmit={search}
          placeholder="Search your notes"
          onVoice={onVoice}
          voiceAvailable={canRecordInBackground() !== 'unsupported' || recordingIsNativeOnly}
        />
      </Section>

      <View className="gap-y-1">
        <Text className="text-center font-data text-[16px] text-snow">Your Event Experience Starts Here</Text>
        <EventHeroPager products={heroes} isRegistered={isRegisteredFor} />
      </View>

      <Section className="gap-y-3">
        <SectionHeading title="Quick Access" />
        <QuickAccessGrid items={QUICK_ACCESS} />
      </Section>

      <View className="gap-y-3">
        <Section>
          <SectionHeading title="Featured" />
        </Section>
        <FeaturedRow items={FEATURED} />
      </View>

      <Section>
        <NeedHelp />
      </Section>

      <Section>
        <ContinueLearning />
      </Section>
    </TabScreen>
  );
}
