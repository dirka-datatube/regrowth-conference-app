import { useRef, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { EventHero } from './EventHero';
import type { Product } from '@/lib/events';

/**
 * The featured-event hero as a swipeable stack of events. The comp's tilted
 * backing card reads as "another event sits behind this one", and Home has a
 * Study Tour variant (172:526); swiping brings each event forward with its own
 * registered state. The dots also switch pages, for a mouse.
 */
export function EventHeroPager({
  products,
  isRegistered,
  onChange,
}: {
  products: Product[];
  isRegistered: (eventId: string) => boolean;
  onChange?: (product: Product) => void;
}) {
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  function settle(i: number) {
    const next = Math.max(0, Math.min(products.length - 1, i));
    if (next === index) return;
    setIndex(next);
    onChange?.(products[next]);
  }

  function goTo(i: number) {
    scroller.current?.scrollTo({ x: i * width, animated: true });
    settle(i);
  }

  return (
    <View className="gap-y-3">
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        onScroll={(e) => settle(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {products.map((p) => (
          <View key={p.id} style={{ width }}>
            <EventHero product={p} registered={isRegistered(p.id)} />
          </View>
        ))}
      </ScrollView>

      {products.length > 1 && (
        <View className="flex-row justify-center gap-x-2" accessibilityRole="tablist">
          {products.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => goTo(i)}
              hitSlop={8}
              accessibilityRole="tab"
              accessibilityLabel={p.short}
              accessibilityState={{ selected: i === index }}
              className={`h-2 rounded-pill ${i === index ? 'w-5 bg-snow' : 'w-2 bg-snow/30'}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
