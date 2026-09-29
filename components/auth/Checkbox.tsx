import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/** "Remember me" on Log in (25:260): a 13px square, 40% white; earth with a tick when on. */
export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      hitSlop={10}
      className="flex-row items-center gap-x-2"
    >
      <View className={`h-[13px] w-[13px] items-center justify-center rounded-[1px] ${checked ? 'bg-earth' : 'bg-snow/40'}`}>
        {checked ? <Ionicons name="checkmark" size={11} color={colors.snow} /> : null}
      </View>
      <Text className="font-data text-[11px] text-snow">{label}</Text>
    </Pressable>
  );
}
