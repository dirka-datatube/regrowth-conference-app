import '../global.css';
import { useEffect, useState } from 'react';
import { Slot, SplashScreen, router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { queryClient, queryPersister } from '@/lib/queryClient';
import { IS_DEMO, demoAttendee } from '@/lib/demo';
import { initSentry } from '@/lib/sentry';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setSession = useAppStore((s) => s.setSession);
  const setAttendee = useAppStore((s) => s.setAttendee);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Deferred so analytics never sits on the critical startup path.
    const t = setTimeout(initSentry, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (IS_DEMO) {
      // Inject a fake session + attendee so the app renders without Supabase.
      setSession({ user: { id: demoAttendee.user_id } } as any);
      setAttendee(demoAttendee);
      setReady(true);
      SplashScreen.hideAsync();
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      SplashScreen.hideAsync();
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => data.subscription.unsubscribe();
  }, [setSession, setAttendee]);

  // Push deep links: notifications carry data.route (e.g. "/session/<id>").
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (typeof route === 'string' && route.startsWith('/')) {
        router.push(route as any);
      }
    });
    return () => sub.remove();
  }, []);

  if (!ready) return <View className="flex-1 bg-canvas" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <Slot />
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
