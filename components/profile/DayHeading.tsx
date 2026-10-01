import { View, Text } from 'react-native';

/**
 * A day's heading in a list of sessions — the agenda's day pill (146:2777,
 * "MARCH 15, 2027") without its arrows, since Saved Sessions lists every day.
 */
export function DayHeading({ label }: { label: string }) {
  return (
    <View className="h-[31px] items-center justify-center rounded-pill border border-card-line bg-tile">
      <Text accessibilityRole="header" className="font-label text-[12px] font-bold tracking-[1px] text-snow">
        {label}
      </Text>
    </View>
  );
}
