import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * A pill that toggles in and out of a set — Rate App's "What did you enjoy?",
 * Edit Profile's interests. Outlined off, teal on, so a wrapped row of them
 * still reads as choices (the bare filter Chip is one-of-a-few, in a line).
 */
export function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      className={`h-8 flex-row items-center gap-x-1.5 rounded-pill border px-3.5 ${
        selected ? 'border-ocean bg-ocean' : 'border-card-line bg-tile'
      }`}
    >
      {selected && <Ionicons name="checkmark" size={14} color={colors.snow} />}
      <Text className={`font-ui text-[12px] ${selected ? 'text-snow' : 'text-snow/80'}`}>{label}</Text>
    </Pressable>
  );
}
