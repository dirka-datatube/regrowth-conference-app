import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAttendee } from '@/lib/hooks/useAttendee';
import { useRealtimeInvalidation } from '@/lib/hooks/useRealtimeInvalidation';
import { registerForPush } from '@/lib/push';
import { IS_DEMO } from '@/lib/demo';

export default function TabsLayout() {
  const session = useAppStore((s) => s.session);
  const { data: attendee } = useAttendee();
  useRealtimeInvalidation();

  useEffect(() => {
    if (IS_DEMO) return;
    if (attendee?.id) {
      registerForPush(attendee.id).catch(() => {});
    }
  }, [attendee?.id]);

  if (!session && !IS_DEMO) return <Redirect href="/(auth)/welcome" />;

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
