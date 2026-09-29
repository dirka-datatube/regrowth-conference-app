import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Podcast cover. The comp's cover artwork is a Sprint 12 export, so a brand
 * block with the show's name stands in (as EventHero does for event imagery).
 */
export function EpisodeCover({ size = 'small' }: { size?: 'small' | 'large' }) {
  if (size === 'small') {
    return (
      <View className="h-14 w-14 items-center justify-center rounded-tile bg-ocean/50">
        <Ionicons name="mic" size={22} color={colors.snow} />
      </View>
    );
  }
  return (
    <View className="h-[172px] items-center justify-center gap-y-2 bg-ocean/40">
      <View className="h-14 w-14 items-center justify-center rounded-pill border border-glass-line bg-glass">
        <Ionicons name="mic" size={26} color={colors.snow} />
      </View>
      <Text className="font-label text-[15px] font-bold tracking-[3px] text-snow">IMPACT & INFLUENCE</Text>
      <Text className="font-label text-[10px] font-bold tracking-[4px] text-snow/70">THE REGROWTH PODCAST</Text>
    </View>
  );
}
