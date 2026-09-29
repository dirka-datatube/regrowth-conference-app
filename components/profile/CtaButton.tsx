import { Pressable, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * The v2 teal CTA (`rounded-cta bg-ocean`, Inter SemiBold 13 — Need Help's
 * "Chat with Us"), its outlined partner for secondary actions, and a quiet
 * text-only form for tertiary ones. `block` fills the row at 48px, for a
 * form's submit.
 */

type Tone = 'teal' | 'outline' | 'quiet';

const TONE: Record<Tone, string> = {
  teal: 'bg-ocean',
  outline: 'border border-card-line bg-tile',
  quiet: '',
};

export function CtaButton({
  label,
  icon,
  tone = 'teal',
  onPress,
  loading,
  disabled,
  block,
  accessibilityLabel,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  onPress?: () => void;
  /** Shows a spinner in place of the icon and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  accessibilityLabel?: string;
}) {
  const off = disabled || loading || !onPress;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy: !!loading }}
      // Unless `block`, the button takes its parent's alignment: centred in a
      // state panel, at the start of a card.
      className={`flex-row items-center justify-center gap-x-2 rounded-cta px-4 ${TONE[tone]} ${
        block ? 'h-12 self-stretch' : 'min-h-[40px] py-2.5'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.snow} />
      ) : (
        icon && <Ionicons name={icon} size={16} color={colors.snow} />
      )}
      <Text className="font-data text-[13px] font-semibold text-snow" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
