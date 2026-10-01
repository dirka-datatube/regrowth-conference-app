import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * The guide's buttons, in the v2 recipes: the teal CTA (`rounded-cta bg-ocean`,
 * Inter SemiBold 13), its outlined partner for secondary actions, and the earth
 * pill the comps use for a screen's one primary action.
 */

type Tone = 'ocean' | 'outline' | 'earth';

const TONE: Record<Tone, { box: string; text: string; icon: string }> = {
  ocean: { box: 'rounded-cta bg-ocean', text: 'text-snow', icon: colors.snow },
  outline: { box: 'rounded-cta border border-card-line bg-tile', text: 'text-snow', icon: colors.snow },
  earth: { box: 'rounded-pill bg-earth', text: 'text-basalt', icon: colors.basalt },
};

export function ActionButton({
  label,
  icon,
  tone = 'ocean',
  onPress,
  accessibilityLabel,
  selected,
  className,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** For toggles (Save session, Follow): announced as selected. */
  selected?: boolean;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !onPress, selected }}
      className={`min-h-[40px] flex-row items-center justify-center gap-x-2 px-4 py-2.5 ${t.box} ${
        onPress ? '' : 'opacity-50'
      } ${className ?? ''}`}
    >
      {icon && <Ionicons name={icon} size={16} color={t.icon} />}
      <Text className={`font-data text-[13px] font-semibold ${t.text}`} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
