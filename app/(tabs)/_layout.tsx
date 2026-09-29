import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAttendee } from '@/lib/hooks/useAttendee';
import { useProfile } from '@/lib/hooks/useProfile';
import { registerForPush } from '@/lib/push';
import { IS_DEMO } from '@/lib/demo';
import { TabBar } from '@/components/TabBar';

/**
 * Bottom navigation — six tabs, per the Figma file (2026-08).
 *
 * Spec v3 listed seven destinations against a stated cap of five; the design
 * resolves that to six by dropping Feedback (Polls & Surveys), which now has
 * no home. Tracked as an open decision in docs/SPEC-V3-GAP-ANALYSIS.md §7 —
 * either accept six or fold Feedback into Insights.
 *
 * Order is fixed by the design: Home · Alerts · Events · Insights · Connect ·
 * Profile. (The route stays `me`; v2 relabelled the tab.)
 */
export default function TabsLayout() {
  const session = useAppStore((s) => s.session);
  // The account's registration (attendee row) and the person (profile) — an
  // account without a registration still has a profile.
  const { data: attendee } = useAttendee();
  useProfile();

  useEffect(() => {
    if (IS_DEMO) return;
    if (attendee?.id) {
      registerForPush(attendee.id).catch(() => {});
    }
  }, [attendee?.id]);

  // Demo included: signing out of the demo lands on Welcome too.
  if (!session) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="connect" options={{ title: 'Connect' }} />
      <Tabs.Screen name="me" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
