import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PillButton } from '@/components/auth/PillButton';
import { completeAuthRedirect, toAuthFlowError } from '@/lib/auth';
import { colors } from '@/lib/theme';

/**
 * Where every auth email lands: sign-up confirmation, the email sign-in link,
 * password recovery, an invitation (Supabase's redirect_to — see
 * authRedirectUrl in lib/auth.ts). completeAuthRedirect signs the person in;
 * recovery and invitation links go on to Set a new password, everything else
 * into the app. A link that has expired or was already used says so.
 */
export default function AuthCallback() {
  const params = useLocalSearchParams();
  const [failure, setFailure] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    completeAuthRedirect(params).then(
      (next) => router.replace(next === 'set-password' ? '/(auth)/reset' : '/(tabs)'),
      (e) => setFailure(toAuthFlowError(e).message),
    );
  }, [params]);

  if (!failure) {
    return (
      <AuthScreen title="Signing you in" subtitle="One moment…">
        <ActivityIndicator color={colors.snow} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title="That link didn’t work" subtitle="Nothing to worry about — request a fresh one">
      <Text className="text-center font-data text-[13px] leading-[19px] text-lede">{failure}</Text>
      <View className="mt-10 items-center gap-y-4">
        <PillButton label="Back to log in" onPress={() => router.replace('/(auth)/login')} />
        <PillButton label="Reset password" variant="outline" onPress={() => router.replace('/(auth)/forgot')} />
      </View>
    </AuthScreen>
  );
}
