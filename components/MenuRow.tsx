import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Profile menu row (145:1518). A row without `onPress` is a destination that
 * is not built yet: it stays in the list, dimmed and without a chevron.
 */
export function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={onPress ? title : `${title} — coming soon`}
      accessibilityState={{ disabled: !onPress }}
      className={`flex-row items-center gap-x-4 rounded-tile border border-card-line p-4 ${onPress ? '' : 'opacity-50'}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-pill bg-well">
        <Ionicons name={icon} size={20} color={colors.snow} />
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text className="font-label text-[14px] font-bold text-snow">{title}</Text>
        <Text className="font-label text-[11px] text-snow/60" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.snow} />}
    </Pressable>
  );
}
