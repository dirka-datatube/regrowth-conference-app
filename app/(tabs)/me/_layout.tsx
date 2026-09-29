import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

/**
 * Profile tab stack: the Profile menu's destinations open inside the tab,
 * keeping the tab bar as the v2 Profile frames do.
 */

// A deep link straight to a child still gets the tab root underneath it, so
// back always has somewhere to go.
export const unstable_settings = { initialRouteName: 'index' };

export default function ProfileStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.midnight } }} />;
}
