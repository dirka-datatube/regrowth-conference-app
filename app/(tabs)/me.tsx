import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { GlassPanel } from '@/components/Glass';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useAppStore } from '@/lib/store';
import { signOut } from '@/lib/auth';

/**
 * Me — profile, saved sessions, resources and settings.
 *
 * Spec v3 submenu: personal profile · saved sessions · CPD records · event
 * resources · app settings. CPD records and event resources are not built;
 * they are listed here as disabled rows so the IA is honest about what exists
 * rather than hiding the gap.
 */

const ROWS = [
  { href: '/profile', icon: 'person-outline', title: 'My profile', body: 'Name, photo, dietary needs and visibility.' },
  { href: '/agenda', icon: 'bookmark-outline', title: 'Saved sessions', body: 'The sessions you have added to your plan.' },
  { href: '/gallery', icon: 'images-outline', title: 'My gallery', body: 'Photos from the event.' },
  { href: '/faqs', icon: 'help-circle-outline', title: 'FAQs', body: 'Answers to the usual questions.' },
] as const;

const UNBUILT = [
  { icon: 'ribbon-outline', title: 'CPD records', body: 'Not available yet.' },
  { icon: 'folder-open-outline', title: 'Event resources', body: 'Not available yet.' },
] as const;

export default function Me() {
  const attendee = useAppStore((s) => s.attendee);

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />

      <View className="px-5 pt-2">
        <ScreenHeader title="Me" subtitle={attendee?.name ?? 'Your profile and settings'} back={false} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 20, paddingBottom: 160, rowGap: 9 }}
      >
        <InstallPrompt />

        <GlassPanel tone="sunken" onPress={() => router.push('/profile')} className="p-5">
          <View className="flex-row items-center gap-x-4">
            {attendee?.photo_url ? (
              <Image
                source={{ uri: attendee.photo_url }}
                className="h-14 w-14 rounded-pill"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View className="h-14 w-14 items-center justify-center rounded-pill bg-glass">
                <Ionicons name="person" size={26} color="#FFFFFF" />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-data text-screen-title text-snow">{attendee?.name ?? 'Your profile'}</Text>
              {attendee?.company && (
                <Text className="mt-0.5 font-body text-note-body text-snow/80">{attendee.company}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#B9C0C9" />
          </View>
        </GlassPanel>

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

        {UNBUILT.map((r) => (
          <View key={r.title} className="rounded-note border-2 border-glass-line/40 p-4 opacity-50">
            <View className="flex-row items-center gap-x-4">
              <View className="h-10 w-10 items-center justify-center rounded-note bg-glass">
                <Ionicons name={r.icon} size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="font-data text-note-title text-snow">{r.title}</Text>
                <Text className="mt-0.5 font-body text-note-body text-snow/80">{r.body}</Text>
              </View>
            </View>
          </View>
        ))}

        <GlassPanel tone="sunken" onPress={() => signOut()} className="mt-2 p-4">
          <View className="flex-row items-center gap-x-4">
            <View className="h-10 w-10 items-center justify-center rounded-note bg-glass">
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </View>
            <Text className="flex-1 font-data text-note-title text-snow">Sign out</Text>
          </View>
        </GlassPanel>
      </ScrollView>
    </SafeAreaView>
  );
}
