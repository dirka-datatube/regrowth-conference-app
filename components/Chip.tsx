import { Pressable, Text } from 'react-native';

/**
 * Filter chip — "All / Recently Viewed / Pinned" on Insights.
 * Selected chips take the muted slate fill from the design; unselected are
 * bare text. Both sit on the same 24px pill so the row doesn't reflow when
 * selection moves.
 */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!selected }}
      className={`h-6 justify-center rounded-pill px-4 ${selected ? 'bg-chip-idle' : ''}`}
    >
      <Text className="font-ui text-tab text-snow">{label}</Text>
    </Pressable>
  );
}
