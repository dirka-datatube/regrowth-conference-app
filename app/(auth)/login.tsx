import { useEffect, useRef, useState } from 'react';
import { View, type TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthField } from '@/components/auth/AuthField';
import { PillButton } from '@/components/auth/PillButton';
import { Checkbox } from '@/components/auth/Checkbox';
import { AuthLink } from '@/components/auth/AuthLink';
import { FormMessage } from '@/components/auth/FormMessage';
import {
  AuthFlowError,
  emailProblem,
  getRememberMe,
  logInProblems,
  normaliseEmail,
  resendConfirmation,
  sendMagicLink,
  signIn,
  toAuthFlowError,
} from '@/lib/auth';

/**
 * Log in — Figma "Log in Screen" (25:260).
 *
 * The comp's "Username" is Email: accounts are email-based. Two lines below
 * LOG IN are additions the comp has no room for: the email sign-in link — the
 * way in the app launched with, kept as the fallback and the route for anyone
 * whose account has no password yet — and the way to Sign up.
 *
 * On success the (auth) layout sees the session and moves into the app.
 */
export default function LogIn() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<'password' | 'link' | 'resend' | null>(null);
  const [problem, setProblem] = useState<AuthFlowError | null>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    getRememberMe().then(setRemember);
  }, []);

  const errors = submitted ? logInProblems(email, password) : {};

  async function run(kind: NonNullable<typeof busy>, task: () => Promise<void>) {
    setProblem(null);
    setBusy(kind);
    try {
      await task();
    } catch (e) {
      setProblem(toAuthFlowError(e));
    } finally {
      setBusy(null);
    }
  }

  function logIn() {
    setSubmitted(true);
    setProblem(null);
    if (Object.keys(logInProblems(email, password)).length) return;
    run('password', () => signIn({ email, password, remember }));
  }

  function emailLink() {
    if (emailProblem(email)) {
      setProblem(new AuthFlowError('bad-email', 'Enter your email above and we’ll send you a sign-in link.'));
      return;
    }
    run('link', async () => {
      await sendMagicLink(email);
      router.push({ pathname: '/(auth)/check-email', params: { email: normaliseEmail(email), mode: 'link' } });
    });
  }

  function resend() {
    run('resend', async () => {
      await resendConfirmation(email);
      router.push({ pathname: '/(auth)/check-email', params: { email: normaliseEmail(email), mode: 'confirm' } });
    });
  }

  return (
    <AuthScreen title="Welcome back!" subtitle="Enter your details below">
      <View className="gap-y-5">
        <AuthField
          label="Email"
          align="center"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          inputMode="email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          // The account identifier, so password managers pair it with the password.
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <AuthField
          ref={passwordRef}
          label="Password"
          align="center"
          secure
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={logIn}
        />
      </View>

      <View className="mt-[18px] flex-row items-center justify-between">
        <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
        <AuthLink
          label="Forgot your password?"
          size={11}
          onPress={() => router.push({ pathname: '/(auth)/forgot', params: email.trim() ? { email: email.trim() } : {} })}
        />
      </View>

      {problem ? (
        <View className="mt-6">
          <FormMessage
            message={problem.message}
            action={
              problem.problem === 'unconfirmed' && busy === null
                ? { label: 'Send the confirmation email again', onPress: resend }
                : null
            }
          />
        </View>
      ) : null}

      <View className="mt-10 items-center">
        <PillButton label="Log in" onPress={logIn} loading={busy === 'password'} disabled={busy !== null && busy !== 'password'} />
      </View>

      <View className="mt-6 items-center gap-y-3">
        <AuthLink
          action
          underline
          label={busy === 'link' ? 'Sending your sign-in link…' : 'Email me a sign-in link instead'}
          disabled={busy !== null}
          onPress={emailLink}
        />
        <AuthLink lead="New here?" label="Create an account" underline onPress={() => router.navigate('/(auth)/signup')} />
      </View>
    </AuthScreen>
  );
}
