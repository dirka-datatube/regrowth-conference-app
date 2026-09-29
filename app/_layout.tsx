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
import { IS_DEMO } from '@/lib/demo';
import { demoSignIn, demoStartsSignedIn } from '@/lib/demo-auth';
import { applyRememberMe, forgetAccountData, startupForgetsSession } from '@/lib/auth';
import { registerServiceWorker } from '@/lib/pwa';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setSession = useAppStore((s) => s.setSession);
  const [ready, setReady] = useState(false);

  // PWA: offline shell + web push. No-op on native.
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Session bootstrap. "Remember me" is applied before the stored session is
  // read (lib/auth.ts); the layouts' guards then route by the session.
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      if (IS_DEMO) {
        // The demo has no backend: it opens signed in as the demo account
        // unless Remember me, a sign-out in this tab or a link straight to a
        // signed-out screen says otherwise (lib/demo-auth.ts).
        const forget = await startupForgetsSession();
        if (!forget && demoStartsSignedIn()) demoSignIn();
      } else {
        const forgot = await applyRememberMe();
        const session = forgot ? null : (await supabase.auth.getSession()).data.session;
        if (!active) return;
        setSession(session);
        const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
          // Signed out elsewhere, or the session could not be refreshed: drop
          // what the app held for the account, as signOut() does.
          if (event === 'SIGNED_OUT') forgetAccountData();
          else setSession(next);
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      }
      if (!active) return;
      setReady(true);
      SplashScreen.hideAsync();
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
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
