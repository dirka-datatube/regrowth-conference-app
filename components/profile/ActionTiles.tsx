import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * A row of action tiles in the Quick Access recipe (Home 132:687): Scan QR, My
 * QR and Scan a Card on Networking Connections. Tiles that run an action
 * rather than open a route, so they take `onPress` where QuickAccessGrid takes
 * an href.
 */

export type ActionTile = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; hint?: string };

export function ActionTiles({ items }: { items: ActionTile[] }) {
  return (
    <View className="flex-row gap-2.5">
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          accessibilityHint={item.hint}
          className="h-[80px] flex-1 items-center justify-center gap-y-2 rounded-tile border border-tile-line bg-tile backdrop-blur"
        >
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-well">
            <Ionicons name={item.icon} size={20} color={colors.snow} />
          </View>
          <Text className="text-center font-data text-[11px] font-semibold text-snow">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
