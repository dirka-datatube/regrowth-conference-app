import { View, Text } from 'react-native';
import { AuthLink } from './AuthLink';

/**
 * A message for the whole form, above its button: what went wrong, or for
 * `info` what just happened — with an optional follow-up ("Send the
 * confirmation email again").
 */
export function FormMessage({
  message,
  tone = 'error',
  action,
}: {
  message?: string | null;
  tone?: 'error' | 'info';
  action?: { label: string; onPress: () => void } | null;
}) {
  if (!message) return null;
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      className={`w-full items-center gap-y-2 rounded-tile border px-3 py-2.5 ${
        tone === 'error' ? 'border-alert-action/60 bg-alert-action/10' : 'border-ocean bg-teal-wash'
      }`}
    >
      <Text className="text-center font-data text-[12px] leading-[16px] text-snow">{message}</Text>
      {action ? <AuthLink label={action.label} onPress={action.onPress} action underline /> : null}
    </View>
  );
}
