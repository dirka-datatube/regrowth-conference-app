import { useRef, useState } from 'react';
import { View, Text, type TextInput } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthField } from '@/components/auth/AuthField';
import { PillButton } from '@/components/auth/PillButton';
import { AuthLink } from '@/components/auth/AuthLink';
import { FormMessage } from '@/components/auth/FormMessage';
import {
  AuthFlowError,
  PASSWORD_MIN_LENGTH,
  normaliseEmail,
  signUp,
  signUpProblems,
  toAuthFlowError,
  type SignUpDetails,
} from '@/lib/auth';

/**
 * Sign up — Figma "Sign up Screen" (34:767).
 *
 * Open to anyone (client decision, 2026-09). Creating an account does not
 * register anyone for an event: that is paid for on the website, and the
 * account picks the registration up by email (migration 20260929000100).
 * Errors show under each field once the form has been submitted. "Already
 * have an account? Log in" is an addition the comp has no room for.
 *
 * With email confirmation on (it must be: registrations link by email) the
 * next stop is Confirm your email; otherwise the (auth) layout moves the new
 * session into the app.
 */

type Field = keyof SignUpDetails;
const EMPTY: SignUpDetails = { firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '' };

export default function SignUp() {
  const [details, setDetails] = useState<SignUpDetails>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<AuthFlowError | null>(null);
  const refs = {
    lastName: useRef<TextInput>(null),
    phone: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    password: useRef<TextInput>(null),
    confirmPassword: useRef<TextInput>(null),
  };

  const errors = submitted ? signUpProblems(details) : {};
  const set = (field: Field) => (value: string) => setDetails((d) => ({ ...d, [field]: value }));
  const next = (field: keyof typeof refs) => () => refs[field].current?.focus();

  async function submit() {
    setSubmitted(true);
    setProblem(null);
    if (Object.keys(signUpProblems(details)).length) return;
    setBusy(true);
    try {
      const { confirmEmail } = await signUp(details);
      if (confirmEmail) {
        router.push({ pathname: '/(auth)/check-email', params: { email: normaliseEmail(details.email), mode: 'confirm' } });
      }
    } catch (e) {
      setProblem(toAuthFlowError(e));
    } finally {
      setBusy(false);
    }
  }

  // A field's value, change handler and (once submitted) its error.
  const field = (name: Field) => ({ value: details[name], onChangeText: set(name), error: errors[name] });

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Enter your details below"
      footer={
        <Text className="text-center font-data text-[10px] leading-[13px] text-quiet">
          By continuing, I agree to REGROWTH’s{' '}
          <Text accessibilityRole="link" onPress={() => router.push('/legal/terms')} className="underline">
            Terms & Conditions
          </Text>{' '}
          and acknowledge the{' '}
          <Text accessibilityRole="link" onPress={() => router.push('/legal/privacy')} className="underline">
            Privacy Policy
          </Text>
          .
        </Text>
      }
    >
      <View className="gap-y-3">
        <View className="flex-row gap-x-[11px]">
          <View className="flex-1">
            <AuthField
              label="First Name"
              {...field('firstName')}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={next('lastName')}
            />
          </View>
          <View className="flex-1">
            <AuthField
              ref={refs.lastName}
              label="Last Name"
              {...field('lastName')}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={next('phone')}
            />
          </View>
        </View>
        <AuthField
          ref={refs.phone}
          label="Phone"
          {...field('phone')}
          inputMode="tel"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={next('email')}
        />
        <AuthField
          ref={refs.email}
          label="Email"
          {...field('email')}
          inputMode="email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          // iOS saves the new password against the field marked as the username.
          textContentType="username"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={next('password')}
        />
        <AuthField
          ref={refs.password}
          label="Password"
          secure
          {...field('password')}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          passwordRules={`minlength: ${PASSWORD_MIN_LENGTH};`}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={next('confirmPassword')}
        />
        <AuthField
          ref={refs.confirmPassword}
          label="Confirm Password"
          secure
          {...field('confirmPassword')}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      {problem ? (
        <View className="mt-5">
          <FormMessage
            message={problem.message}
            action={
              problem.problem === 'account-exists'
                ? {
                    label: 'Log in instead',
                    onPress: () => router.replace({ pathname: '/(auth)/login', params: { email: normaliseEmail(details.email) } }),
                  }
                : null
            }
          />
        </View>
      ) : null}

      <View className="mt-7 items-center">
        <PillButton label="Sign up" onPress={submit} loading={busy} />
      </View>
      <View className="mt-5 items-center">
        <AuthLink lead="Already have an account?" label="Log in" underline onPress={() => router.navigate('/(auth)/login')} />
      </View>
    </AuthScreen>
  );
}
