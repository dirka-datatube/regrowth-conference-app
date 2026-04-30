import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAttendee } from '@/lib/hooks/useAttendee';
import { registerForPush } from '@/lib/push';
import { IS_DEMO } from '@/lib/demo';

export default function TabsLayout() {
  const session = useAppStore((s) => s.session);
  const { data: attendee } = useAttendee();

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
          backgroundColor: '#04072F',
          borderTopColor: '#1a1d3d',
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: '#D17F5D',
        tabBarInactiveTintColor: '#8A8DA6',
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
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
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
        name="notes"
        options={{
          title: 'Event Notes',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
