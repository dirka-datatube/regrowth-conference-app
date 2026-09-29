import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/** Round glass header control — the same button as Profile's mic and camera (34:1423). */
export function HeaderIconButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-[38px] w-[41px] items-center justify-center rounded-pill border border-glass-line bg-glass"
    >
      <Ionicons name={icon} size={20} color={colors.snow} />
    </Pressable>
  );
}
