import { Redirect, Stack, useSegments } from 'expo-router';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';

export const unstable_settings = { initialRouteName: 'welcome' };

/**
 * The signed-out screens: Welcome (1:3), Log in (25:260), Sign up (34:767),
 * and the password and email-link screens around them.
 *
 * A session moves the person into the app however it arrived — logging in,
 * signing up without email confirmation, the confirmation link opened in
 * another tab. Reset is the exception: a recovery link signs the person in
 * before they have chosen their new password.
 */
export default function AuthLayout() {
  const session = useAppStore((s) => s.session);
  const segments = useSegments();
  const choosingPassword = segments[segments.length - 1] === 'reset';

  if (session && !choosingPassword) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.midnight } }} />;
}
