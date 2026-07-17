import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { Monogram } from '@/components/Monogram';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';

// Deep-link target for the venue QR posters (regrowth://check-in).
// Scanning at the door lands here and checks the attendee in immediately.
export default function CheckInLanding() {
  const attendee = useAppStore((s) => s.attendee);
  const [state, setState] = useState<'working' | 'done' | 'already' | 'error'>('working');

  useEffect(() => {
    if (!attendee) return;
    if (IS_DEMO) {
      setState('done');
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('check-in', {
        body: { source: 'self' },
      });
      if (error || data?.error) setState('error');
      else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setState(data?.already ? 'already' : 'done');
      }
    })();
  }, [attendee]);

  return (
    <Screen scroll={false} variant="moment">
      <View className="flex-1 items-center justify-center">
        <Monogram size={72} moment />
        {state === 'working' && (
          <T variant="script" className="mt-8">Checking you in…</T>
        )}
        {state === 'done' && (
          <>
            <T variant="h1" className="mt-8 text-moment-ink text-center">You're in.</T>
            <T variant="body" className="mt-2 text-moment-soft text-center px-8">
              Welcome to REGROWTH 2026 — we're glad you made it.
            </T>
          </>
        )}
        {state === 'already' && (
          <>
            <T variant="h1" className="mt-8 text-moment-ink text-center">Already in.</T>
            <T variant="body" className="mt-2 text-moment-soft text-center px-8">
              You're checked in for today — enjoy it.
            </T>
          </>
        )}
        {state === 'error' && (
          <>
            <T variant="h1" className="mt-8 text-moment-ink text-center">One more try</T>
            <T variant="body" className="mt-2 text-moment-soft text-center px-8">
              That didn't go through — the team at the door can scan you in, or
              tap check-in on Home.
            </T>
          </>
        )}
        <View className="mt-10 w-full px-8">
          <Button label="Go to Home" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    </Screen>
  );
}
