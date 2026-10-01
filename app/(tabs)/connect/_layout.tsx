import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

/**
 * Connect tab stack: communities, partners, podcast and referrals open inside
 * the tab, keeping the tab bar as the v2 Connect frames do.
 */

// A deep link straight to a child still gets the tab root underneath it, so
// back always has somewhere to go.
export const unstable_settings = { initialRouteName: 'index' };

export default function ConnectStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.midnight } }} />;
}
