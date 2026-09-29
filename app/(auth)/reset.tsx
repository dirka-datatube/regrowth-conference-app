import { useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthField } from '@/components/auth/AuthField';
import { PillButton } from '@/components/auth/PillButton';
import { AuthLink } from '@/components/auth/AuthLink';
import { FormMessage } from '@/components/auth/FormMessage';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import {
  AuthFlowError,
  PASSWORD_MIN_LENGTH,
  newPasswordProblems,
  toAuthFlowError,
  updatePassword,
} from '@/lib/auth';

/**
 * Set a new password — no frame in the file; built in the auth language of
 * Log in (25:260). Re-check against the file when a frame exists.
 *
 * Reached from a password-recovery or invitation link: /auth-callback has
 * signed the person in, and saving moves on into the app. With no session the
 * link has expired (or the screen was opened directly), so it offers a new
 * one. The demo shows the form either way.
 */
export default function ResetPassword() {
  const session = useAppStore((s) => s.session);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<AuthFlowError | null>(null);
  const confirmRef = useRef<TextInput>(null);

  if (!session && !IS_DEMO) {
    return (
      <AuthScreen title="Link expired" subtitle="This reset link has expired or has already been used">
        <View className="items-center gap-y-6">
          <PillButton label="Send a new link" onPress={() => router.replace('/(auth)/forgot')} />
          <AuthLink label="Back to log in" underline onPress={() => router.replace('/(auth)/login')} />
        </View>
      </AuthScreen>
    );
  }

  const errors = submitted ? newPasswordProblems(password, confirmPassword) : {};

  async function save() {
    setSubmitted(true);
    setProblem(null);
    if (Object.keys(newPasswordProblems(password, confirmPassword)).length) return;
    setBusy(true);
    try {
      await updatePassword(password);
      router.replace('/(tabs)');
    } catch (e) {
      setProblem(toAuthFlowError(e));
      setBusy(false);
    }
  }

  const email = session?.user.email;

  return (
    <AuthScreen title="Set a new password" subtitle={email ? `For ${email}` : 'Choose a new password for your account'}>
      <View className="gap-y-5">
        <AuthField
          label="New Password"
          align="center"
          secure
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          passwordRules={`minlength: ${PASSWORD_MIN_LENGTH};`}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <AuthField
          ref={confirmRef}
          label="Confirm New Password"
          align="center"
          secure
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={save}
        />
      </View>

      {problem ? (
        <View className="mt-6">
          <FormMessage message={problem.message} />
        </View>
      ) : null}

      <View className="mt-10 items-center">
        <PillButton label="Save password" onPress={save} loading={busy} />
      </View>
      {session ? (
        <View className="mt-6 items-center">
          <AuthLink label="Not now" underline onPress={() => router.replace('/(tabs)')} />
        </View>
      ) : null}
    </AuthScreen>
  );
}
