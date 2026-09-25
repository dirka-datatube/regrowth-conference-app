import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { eventEntryHref, type Product } from '@/lib/events';

/**
 * Featured event hero — Home (3:1921 / 132:598) and Events (129:420 / 134:819).
 *
 * A 284×418 card over a second card tilted −12°, the event name top-left, and
 * a glass pill near the foot. Registered attendees get the "You're
 * Registered!" badge and ACCESS EVENT; everyone else gets GET STARTED.
 *
 * IMAGERY — both cards are photographs in the comp. They could not be
 * exported from this environment (figma.com is network-blocked), so the cards
 * are brand-colour blocks until Sprint 12 drops the images in.
 */

export function EventHero({ product, registered }: { product: Product; registered: boolean }) {
  const cta = registered ? 'ACCESS EVENT' : 'GET STARTED';

  return (
    <View className="h-[439px] w-[342px] self-center">
      {/* Tilted backing card */}
      <View
        className="absolute left-[38px] top-[23px] h-[392px] w-[266px] rounded-hero bg-earth/50"
        style={{ transform: [{ rotate: '-12deg' }] }}
      />

      <View className="absolute left-[26px] top-[21px] h-[418px] w-[284px] overflow-hidden rounded-hero bg-midnight">
        <View className="absolute inset-0 bg-ocean/40" />

        <View className="px-[18px] pt-[45px]">
          <Text className="font-data text-[24px] text-snow">{product.title}</Text>
          <Text className="mt-1.5 font-body text-[16px] text-snow">{product.subtitle}</Text>
          {registered && (
            <View className="mt-4 self-start rounded-md bg-ocean px-3 py-1.5">
              <Text className="font-data text-[11px] font-semibold text-snow">You’re Registered!</Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => router.push(eventEntryHref(product.id) as never)}
          accessibilityRole="button"
          accessibilityLabel={`${cta} — ${product.short}`}
          className="absolute bottom-[24px] left-[32px] h-[72px] w-[219px] items-center justify-center rounded-pill border border-glass-line bg-snow/5 backdrop-blur-2xl"
        >
          <Text className="font-data text-[15px] text-snow">{cta}</Text>
        </Pressable>
      </View>
    </View>
  );
}
