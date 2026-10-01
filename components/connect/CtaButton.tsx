import { Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/** The v2 teal CTA (Need Help → Chat with Us); `wide` fills the row at 48px. */
export function CtaButton({
  label,
  icon,
  onPress,
  busy,
  disabled,
  wide,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  busy?: boolean;
  disabled?: boolean;
  wide?: boolean;
}) {
  const off = disabled || busy || !onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: !!busy }}
      className={`flex-row items-center justify-center gap-x-2 rounded-cta bg-ocean px-4 py-2.5 ${
        wide ? 'h-12 self-stretch' : 'self-center'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.snow} />
      ) : (
        icon && <Ionicons name={icon} size={16} color={colors.snow} />
      )}
      <Text className="font-data text-[13px] font-semibold text-snow">{label}</Text>
    </Pressable>
  );
}
