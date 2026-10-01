import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/** One What to Pack item: a tick box on the v2 menu-row surface. */
export function CheckRow({
  label,
  note,
  checked,
  onToggle,
}: {
  label: string;
  note?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={note ? `${label}, ${note}` : label}
      className={`min-h-[52px] flex-row items-center gap-x-3 rounded-tile border px-3.5 py-3 ${
        checked ? 'border-teal-line bg-teal-wash' : 'border-card-line bg-tile'
      }`}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
        color={checked ? colors.accent : colors.quiet}
      />
      <View className="flex-1 gap-y-0.5">
        <Text className={`font-data text-[14px] ${checked ? 'text-quiet line-through' : 'text-snow'}`}>{label}</Text>
        {!!note && <Text className="font-data text-[12px] text-quiet">{note}</Text>}
      </View>
    </Pressable>
  );
}
