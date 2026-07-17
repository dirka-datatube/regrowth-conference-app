import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAttendee } from '@/lib/hooks/useAttendee';
import { useRealtimeInvalidation } from '@/lib/hooks/useRealtimeInvalidation';
import { registerForPush } from '@/lib/push';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { IS_DEMO } from '@/lib/demo';

export default function TabsLayout() {
  const session = useAppStore((s) => s.session);
  const { data: attendee } = useAttendee();
  useRealtimeInvalidation();

  const qc = useQueryClient();

  useEffect(() => {
    if (IS_DEMO) return;
    if (attendee?.id) {
      registerForPush(attendee.id).catch(() => {});
    }
    // Warm the day's content in parallel so tab switches feel instant.
    if (attendee?.event_id) {
      const eventId = attendee.event_id;
      qc.prefetchQuery({
        queryKey: ['sessions', eventId],
        queryFn: async () => {
          const { data } = await supabase
            .from('sessions')
            .select(
              `id, title, abstract, start_at, end_at, room, type, tags,
               speakers:session_speakers(speaker:speakers(id, name, headshot_url, title))`,
            )
            .eq('event_id', eventId)
            .eq('is_published', true)
            .order('start_at');
          return data ?? [];
        },
      });
      qc.prefetchQuery({
        queryKey: ['speakers', eventId],
        queryFn: async () => {
          const { data } = await supabase
            .from('speakers')
            .select('id, name, title, company, headshot_url, tags')
            .eq('event_id', eventId)
            .order('display_order')
            .order('name');
          return data ?? [];
        },
      });
    }
  }, [attendee?.id, attendee?.event_id, qc]);

  const onboardingSeen = useAppStore((s) => s.onboardingSeen);

  if (!session && !IS_DEMO) return <Redirect href="/(auth)/welcome" />;

  // First run: a 60-second onboarding when we know nothing about them yet.
  if (
    !IS_DEMO &&
    attendee &&
    !onboardingSeen &&
    !attendee.photo_url &&
    (attendee.interests?.length ?? 0) === 0
  ) {
    return <Redirect href={"/onboarding" as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E2D9',
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: '#B85F3D',
        tabBarInactiveTintColor: '#8B8EA6',
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
