import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/** The 40×40 notification bell in the event guide's headers (108:599) — opens Alerts. */
export function EventBell() {
  return (
    <Pressable
      onPress={() => router.navigate('/alerts')}
      accessibilityRole="button"
      accessibilityLabel="Alerts"
      className="h-10 w-10 items-center justify-center rounded-pill border border-glass-line bg-glass"
    >
      <Ionicons name="notifications-outline" size={20} color={colors.snow} />
    </Pressable>
  );
}
