import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { FeaturedItem } from '@/lib/content';
import { colors } from '@/lib/theme';

/**
 * Featured — 140×160 content cards in a horizontal row (Home 132:639).
 *
 * Each card is a photograph under a 55% black scrim in the comp. The images
 * are a Sprint 12 export, so the icon stands in for now; the scrim and type
 * are already to spec.
 */
export function FeaturedRow({ items }: { items: FeaturedItem[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, columnGap: 10 }}
    >
      {items.map((item) => (
        <Pressable
          key={item.key}
          disabled={!item.href}
          onPress={() => item.href && router.push(item.href as never)}
          accessibilityRole={item.href ? 'link' : undefined}
          accessibilityLabel={`${item.title}, ${item.subtitle}`}
          className="h-40 w-[140px] justify-between overflow-hidden rounded-tile border border-hairline bg-well p-3"
        >
          <View className="absolute inset-0 bg-scrim" />
          <View className="gap-y-1">
            <Text className="font-data text-[12px] font-bold text-snow" numberOfLines={3}>
              {item.title}
            </Text>
            <Text className="font-data text-[10px] text-quiet" numberOfLines={1}>
              {item.subtitle}
            </Text>
          </View>
          <Ionicons name={item.icon} size={28} color={colors.indicator} style={{ alignSelf: 'flex-end' }} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
