import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { GlassPanel } from '@/components/Glass';

/**
 * Connect — the networking hub.
 *
 * Spec v3 submenu: connect with other attendees · find a referral ·
 * Impact & Influence · Partners. The Figma frame for this screen is an empty
 * shell, so the layout here follows the Insights/Events design language
 * (glass rows, Inter titles, Butler supporting copy) rather than inventing a
 * new one. Swap for the real comp when the designer fills the frame.
 *
 * "Find a referral" has no destination yet — it is unbuilt and unpriced.
 */

const ROWS = [
  {
    href: '/attendees',
    icon: 'people-outline',
    title: 'Attendees',
    body: 'Browse who else is here and swap details.',
  },
  {
    href: '/connections',
    icon: 'qr-code-outline',
    title: 'My connections',
    body: 'Your QR code, scanned cards and everyone you have met.',
  },
  {
    href: '/partners',
    icon: 'business-outline',
    title: 'Partners',
    body: 'The businesses supporting this event.',
  },
  {
    href: '/podcast',
    icon: 'mic-circle-outline',
    title: 'Impact & Influence',
    body: 'Episodes recorded with REGROWTH members.',
  },
] as const;

export default function Connect() {
  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />

      <View className="px-5 pt-2">
        <ScreenHeader title="Connect" subtitle="Find your people while you are here" back={false} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 20, paddingBottom: 160, rowGap: 9 }}
      >
        {ROWS.map((r) => (
          <GlassPanel key={r.href} tone="sunken" onPress={() => router.push(r.href as never)} className="p-4">
            <View className="flex-row items-center gap-x-4">
              <View className="h-10 w-10 items-center justify-center rounded-note bg-glass">
                <Ionicons name={r.icon} size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="font-data text-note-title text-snow">{r.title}</Text>
                <Text className="mt-0.5 font-body text-note-body text-snow/80">{r.body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#B9C0C9" />
            </View>
          </GlassPanel>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
