import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeatureButton } from '@/components/FeatureCard';
import { colors } from '@/lib/theme';

/**
 * The event home's info boxes (146:2711 and siblings): FeatureCard's recipe —
 * scrim, Inter title, Butler line, a button at the foot — at the comp's 165px
 * height rather than Connect's 196.
 *
 * IMAGERY — the comp puts a photograph under the scrim; like FeatureCard, the
 * scrim stands in until the Sprint 12 export, with the section's glyph faint
 * in the corner so the six boxes can be told apart.
 */
export function InfoCard({
  title,
  body,
  cta,
  icon,
  onPress,
}: {
  title: string;
  body: string;
  cta: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <View className="min-h-[165px] justify-between overflow-hidden rounded-feature bg-scrim-strong px-5 pb-4 pt-[18px]">
      <View className="absolute -right-3 -top-2 opacity-[0.07]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={icon} size={104} color={colors.snow} />
      </View>
      <View className="gap-y-1 pr-10">
        <Text className="font-data text-[20px] font-semibold text-snow">{title}</Text>
        <Text className="font-body text-[13px] text-snow">{body}</Text>
      </View>
      <View className="mt-5">
        <FeatureButton label={cta} onPress={onPress} />
      </View>
    </View>
  );
}
