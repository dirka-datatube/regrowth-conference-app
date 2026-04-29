import '../global.css';
import { useEffect, useState } from 'react';
import { Slot, SplashScreen } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { queryClient, queryPersister } from '@/lib/queryClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setSession = useAppStore((s) => s.setSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      SplashScreen.hideAsync();
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => data.subscription.unsubscribe();
  }, [setSession]);

  if (!ready) return <View className="flex-1 bg-midnight" />;

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
