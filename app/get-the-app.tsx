import { View, Text, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { GlassPanel } from '@/components/Glass';
import { Button } from '@/components/Button';
import { NATIVE_APP } from '@/lib/capture';
import { getInstallStateLabel } from '@/lib/pwa';

/**
 * "Get the app" — the destination for anyone who hits a native-only feature
 * in the browser.
 *
 * The hybrid decision (2026-08-19) means two surfaces exist on purpose: the
 * mobile website is the front door because the App Store download was the
 * stated barrier to entry, and the native build exists for the two things a
 * browser genuinely cannot do. This page has to make that sound like a choice
 * rather than an apology, and be straight about what each one gives you.
 */

const WEB_HAS = [
  'Your agenda, sessions and speakers',
  'Notes, search and pinning',
  'QR connect and the attendee directory',
  'Everything works offline once loaded',
];

const APP_ADDS = [
  'Session reminders that reach your lock screen',
  'Record a whole session with your phone in your pocket',
];

function Row({ icon, label, tone }: { icon: keyof typeof Ionicons.glyphMap; label: string; tone: string }) {
  return (
    <View className="flex-row items-start gap-x-3 py-1.5">
      <Ionicons name={icon} size={16} color={tone} />
      <Text className="flex-1 font-body text-note-body text-snow/90">{label}</Text>
    </View>
  );
}

export default function GetTheApp() {
  const available = Boolean(NATIVE_APP.ios || NATIVE_APP.android);

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />

      <View className="px-5 pt-2">
        <ScreenHeader title="Get the app" subtitle="For reminders and session recording" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 20, paddingBottom: 60, rowGap: 9 }}
      >
        <GlassPanel tone="sunken" className="p-5">
          <Text className="font-data text-note-title text-snow">You already have everything here</Text>
          <View className="mt-3">
            {WEB_HAS.map((l) => (
              <Row key={l} icon="checkmark-circle-outline" label={l} tone="#4BA9A8" />
            ))}
          </View>
        </GlassPanel>

        <GlassPanel tone="sunken" className="p-5">
          <Text className="font-data text-note-title text-snow">The app adds two things</Text>
          <View className="mt-3">
            {APP_ADDS.map((l) => (
              <Row key={l} icon="phone-portrait-outline" label={l} tone="#539DF3" />
            ))}
          </View>
          <Text className="mt-3 font-body text-note-body text-snow/70">
            Your browser stops recording when the screen locks — that is a limit of the browser
            itself, not of this app. The REGROWTH app keeps going.
          </Text>

          <View className="mt-5">
            {available ? (
              <Button
                label="Get the REGROWTH app"
                onPress={() => {
                  const url = NATIVE_APP.ios ?? NATIVE_APP.android;
                  if (url) Linking.openURL(url);
                }}
              />
            ) : (
              <View className="rounded-note border-2 border-glass-line/40 p-4">
                <Text className="font-data text-note-title text-snow">Not released yet</Text>
                <Text className="mt-1 font-body text-note-body text-snow/80">
                  The app is in build. We will email you a link when it is ready — nothing here
                  stops working in the meantime.
                </Text>
              </View>
            )}
          </View>
        </GlassPanel>

        <Text className="px-3 pt-2 text-center font-body text-note-body text-snow/60">
          {getInstallStateLabel()}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
