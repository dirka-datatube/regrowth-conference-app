import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/** Rate App's five large stars (227:2617), gold when lit ("Colors/Yellow"). */
export function StarRating({ value, onChange }: { value: number; onChange: (stars: number) => void }) {
  return (
    <View className="flex-row items-center justify-center gap-x-2" accessibilityRole="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={4}
          accessibilityRole="radio"
          accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
          accessibilityState={{ checked: value === n }}
          className="p-1"
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={44}
            color={n <= value ? colors.alertReminder : colors.indicator}
          />
        </Pressable>
      ))}
    </View>
  );
}
