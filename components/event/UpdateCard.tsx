import { View, Text, Pressable } from 'react-native';
import type { FeedItem } from '@/lib/eventContent';

/**
 * A "What's Coming" card (146:2579): dot, title and when; the message; then
 * time • place and View Details. Live sessions carry a green dot.
 */
export function UpdateCard({ item, onOpen }: { item: FeedItem; onOpen?: () => void }) {
  return (
    <View className="gap-y-3 rounded-card border border-hairline bg-tile p-4">
      <View className="flex-row items-center gap-x-2">
        <View className={`h-2 w-2 rounded-pill ${item.live ? 'bg-switch-on' : 'bg-earth'}`} />
        <Text className="flex-1 font-data text-[15px] font-semibold text-snow" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className={`font-label text-[11px] font-bold ${item.live ? 'text-switch-on' : 'text-quiet'}`}>
          {item.when}
        </Text>
      </View>
      {!!item.body && (
        <Text className="font-data text-[13px] leading-[16px] text-lede" numberOfLines={3}>
          {item.body}
        </Text>
      )}
      {!!(item.meta || onOpen) && (
        <View className="flex-row items-center justify-between gap-x-3">
          <Text className="flex-1 font-data text-[12px] text-quiet" numberOfLines={1}>
            {item.meta ?? ''}
          </Text>
          {onOpen && (
            <Pressable
              onPress={onOpen}
              accessibilityRole="button"
              accessibilityLabel={`View details — ${item.title}`}
              className="rounded-cta bg-ocean px-3 py-1.5"
            >
              <Text className="font-data text-[11px] font-semibold text-snow">View Details</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
