import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDayHeading, type DayKey } from '@/lib/eventTime';
import { colors } from '@/lib/theme';

function DayArrow({
  to,
  icon,
  label,
  onChange,
}: {
  to: DayKey | null;
  icon: 'chevron-back' | 'chevron-forward';
  label: string;
  onChange: (day: DayKey) => void;
}) {
  return (
    <Pressable
      onPress={() => to && onChange(to)}
      disabled={!to}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !to }}
      className={`h-[31px] w-10 items-center justify-center ${to ? '' : 'opacity-30'}`}
    >
      <Ionicons name={icon} size={16} color={colors.snow} />
    </Pressable>
  );
}

/** The agenda's day switcher (146:2777): "MARCH 15, 2027" between previous and next. */
export function DaySelector({
  days,
  value,
  onChange,
}: {
  days: DayKey[];
  value: DayKey;
  onChange: (day: DayKey) => void;
}) {
  const i = days.indexOf(value);
  const prev = i > 0 ? days[i - 1] : null;
  const next = i >= 0 && i < days.length - 1 ? days[i + 1] : null;

  return (
    <View className="h-[31px] flex-row items-center justify-between rounded-pill border border-card-line bg-tile">
      <DayArrow to={prev} icon="chevron-back" label="Previous day" onChange={onChange} />
      <View className="flex-1 items-center" accessibilityLiveRegion="polite">
        <Text
          accessibilityLabel={`${formatDayHeading(value)}, day ${i + 1} of ${days.length}`}
          className="font-label text-[12px] font-bold tracking-[1px] text-snow"
        >
          {formatDayHeading(value)}
        </Text>
      </View>
      <DayArrow to={next} icon="chevron-forward" label="Next day" onChange={onChange} />
    </View>
  );
}
