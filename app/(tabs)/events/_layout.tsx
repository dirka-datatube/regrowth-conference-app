import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

/**
 * Events tab stack. The event guide (agenda, speakers, map…) opens inside the
 * tab so the tab bar stays, as it does in every v2 event frame.
 */

// A deep link straight to a child still gets the tab root underneath it, so
// back always has somewhere to go.
export const unstable_settings = { initialRouteName: 'index' };

export default function EventsStack() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.midnight } }} />;
}
