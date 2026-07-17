import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from './Type';

// Standard back header for pushed screens.
export function Header({
  label,
  right,
  moment = false,
}: {
  label: string;
  right?: React.ReactNode;
  moment?: boolean;
}) {
  const color = moment ? '#FFFFFF' : '#04072F';
  return (
    <View className="flex-row items-center justify-between pt-2">
      <View className="flex-row items-center flex-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={color} />
        </Pressable>
        <T variant="caption" className={`ml-2 ${moment ? 'text-moment-soft' : ''}`}>
          {label}
        </T>
      </View>
      {right}
    </View>
  );
}
