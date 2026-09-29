import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthField } from '@/components/auth/AuthField';
import { PillButton } from '@/components/auth/PillButton';
import { AuthLink } from '@/components/auth/AuthLink';
import { FormMessage } from '@/components/auth/FormMessage';
import { AuthFlowError, emailProblem, normaliseEmail, sendPasswordReset, toAuthFlowError } from '@/lib/auth';

/**
 * Forgot your password — no frame in the file; built in the auth language of
 * Log in (25:260). Re-check against the file when a frame exists.
 *
 * Sends the recovery email; its link comes back through /auth-callback to Set
 * a new password. Supabase answers alike whether or not the address has an
 * account, and so does this screen: the next stop is always Check your email.
 */
export default function ForgotPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<AuthFlowError | null>(null);

  async function send() {
    setSubmitted(true);
    setProblem(null);
    if (emailProblem(email)) return;
    setBusy(true);
    try {
      await sendPasswordReset(email);
      router.push({ pathname: '/(auth)/check-email', params: { email: normaliseEmail(email), mode: 'reset' } });
    } catch (e) {
      setProblem(toAuthFlowError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen title="Forgot your password?" subtitle="Enter your email and we’ll send you a reset link">
      <AuthField
        label="Email"
        align="center"
        value={email}
        onChangeText={setEmail}
        error={submitted ? emailProblem(email) : undefined}
        inputMode="email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={send}
      />

      {problem ? (
        <View className="mt-6">
          <FormMessage message={problem.message} />
        </View>
      ) : null}

      <View className="mt-10 items-center">
        <PillButton label="Send link" onPress={send} loading={busy} />
      </View>
      <View className="mt-6 items-center">
        <AuthLink label="Back to log in" underline onPress={() => router.navigate('/(auth)/login')} />
      </View>
    </AuthScreen>
  );
}
