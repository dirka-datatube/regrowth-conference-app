import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors } from '@/lib/theme';

/**
 * The small auth pill (Log in 25:260, Sign up 34:767): 177×28, Inter in
 * capitals. Earth for the primary action; outline for Welcome's second one.
 * The touch target reaches past the drawn pill.
 */
export function PillButton({
  label,
  onPress,
  variant = 'earth',
  loading = false,
  disabled = false,
}: {
  /** Sentence case; drawn in capitals. */
  label: string;
  onPress: () => void;
  variant?: 'earth' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={`h-[28px] min-w-[177px] items-center justify-center rounded-pill px-5 active:opacity-80 ${
        variant === 'earth' ? 'bg-earth' : 'border border-snow/70'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.snow} />
      ) : (
        <Text className="font-data text-[13px] uppercase tracking-[0.3px] text-snow">{label}</Text>
      )}
    </Pressable>
  );
}
