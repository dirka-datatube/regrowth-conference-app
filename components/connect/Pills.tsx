import { View, Text } from 'react-native';

/** Small outlined pills — interests on people, categories on partners. */
export function Pills({ items, max, center }: { items: string[]; max?: number; center?: boolean }) {
  if (!items.length) return null;
  const shown = max ? items.slice(0, max) : items;
  const more = items.length - shown.length;
  return (
    <View className={`flex-row flex-wrap gap-1.5 ${center ? 'justify-center' : ''}`}>
      {shown.map((item, i) => (
        // Free-text tags can repeat, so the index keeps keys unique.
        <View key={`${item}-${i}`} className="rounded-pill border border-card-line px-2.5 py-1">
          <Text className="font-ui text-[11px] text-snow/80">{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
        </View>
      ))}
      {more > 0 && (
        <View className="rounded-pill px-1.5 py-1">
          <Text className="font-ui text-[11px] text-quiet">+{more}</Text>
        </View>
      )}
    </View>
  );
}
