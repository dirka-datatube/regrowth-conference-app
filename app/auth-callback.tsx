import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';

// Magic-link redirect target. Supabase appends a code param we exchange for
// a session, then we hand off to the tabs.
export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    (async () => {
      if (params.code) {
        await supabase.auth.exchangeCodeForSession(String(params.code));
      }
      router.replace('/(tabs)');
    })();
  }, [params.code]);

  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <T variant="script">Welcoming you in…</T>
      </View>
    </Screen>
  );
}
