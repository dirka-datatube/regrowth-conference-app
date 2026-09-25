import { View, Text } from 'react-native';

/** v2 section heading: Inter Bold 18, with an optional one-line lede. */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-y-1">
      <Text accessibilityRole="header" className="font-data text-section font-bold text-snow">
        {title}
      </Text>
      {subtitle && <Text className="font-data text-[13px] text-quiet">{subtitle}</Text>}
    </View>
  );
}
