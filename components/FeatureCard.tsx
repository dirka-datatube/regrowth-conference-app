import { ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Connect feature card (92:212): a 196px photo card under an 80% black scrim,
 * title, one line of copy, and its buttons at the foot.
 *
 * IMAGERY — the photographs sit at 20% opacity in the comp and are a Sprint 12
 * export; the scrim alone stands in for now.
 */
export function FeatureCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <View className="min-h-[196px] justify-between overflow-hidden rounded-feature bg-scrim-strong px-5 pb-4 pt-[18px]">
      <View className="gap-y-1">
        <Text className="font-data text-[20px] font-semibold text-snow">{title}</Text>
        <Text className="font-body text-[13px] text-snow">{body}</Text>
      </View>
      <View className="mt-5 gap-y-3">{children}</View>
    </View>
  );
}

type Tone = 'ocean' | 'earth' | 'cloud';

const TONE: Record<Tone, { bg: string; fg: string; icon: string }> = {
  ocean: { bg: 'bg-ocean', fg: 'text-snow', icon: colors.snow },
  earth: { bg: 'bg-earth', fg: 'text-basalt', icon: colors.basalt },
  // Cloud buttons carry the glass hairline in the comp.
  cloud: { bg: 'bg-cloud border-2 border-glass-line', fg: 'text-basalt', icon: colors.basalt },
};

/**
 * 202×37 button on a feature card, wider only if its label needs it. `locked`
 * prefixes a padlock (not registered).
 */
export function FeatureButton({
  label,
  tone = 'cloud',
  locked,
  onPress,
}: {
  label: string;
  tone?: Tone;
  locked?: boolean;
  onPress?: () => void;
}) {
  const t = TONE[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${label} — locked until you register` : label}
      accessibilityState={{ disabled: !onPress }}
      className={`h-[37px] min-w-[202px] flex-row items-center justify-center gap-x-1.5 self-start rounded-[9px] px-3 ${t.bg} ${
        onPress ? '' : 'opacity-60'
      }`}
    >
      {locked && <Ionicons name="lock-closed" size={12} color={t.icon} />}
      <Text className={`font-data text-[12px] font-semibold ${t.fg}`} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
