import { View, Text } from 'react-native';
import { BadgeQr } from './BadgeQr';

/**
 * Entry badge — Profile (146:1755) and My Tickets (146:1906): name, event,
 * tier, the QR, and how to use it. One per confirmed registration.
 */
export function BadgeCard({
  name,
  eventLabel,
  tier,
  qrToken,
  instructions = 'Scan this QR code at the registration desk to gain entry.',
}: {
  name: string;
  /** e.g. "Navigate 2027" — rendered as NAVIGATE 2027 BADGE. */
  eventLabel: string;
  tier: string | null;
  qrToken: string;
  instructions?: string;
}) {
  return (
    <View className="rounded-badge bg-cloud px-6 pb-6 pt-[18px]">
      <View className="min-h-[50px] flex-row items-center justify-between gap-x-3">
        <View className="flex-1 gap-y-1">
          <Text className="font-data text-[24px] font-bold text-midnight" numberOfLines={1}>
            {name}
          </Text>
          <Text className="font-data text-[12px] font-bold uppercase text-midnight/60">
            {eventLabel} Badge
          </Text>
        </View>
        {tier && (
          <View className="rounded-tile bg-ocean px-3 py-1.5">
            <Text className="font-label text-[12px] font-extrabold uppercase text-snow">{tier}</Text>
          </View>
        )}
      </View>

      <View
        className="mt-4 h-[190px] w-[191px] items-center justify-center self-center rounded-card border border-teal-line"
        accessibilityLabel={`${eventLabel} entry QR code for ${name}`}
      >
        <BadgeQr token={qrToken} size={150} />
      </View>

      <View className="mt-4 items-center gap-y-3">
        <View className="flex-row items-center gap-x-2 rounded-pill bg-teal-wash px-4 py-2">
          <View className="h-2 w-2 rounded-pill bg-ocean" />
          <Text className="font-label text-[13px] font-bold text-ocean">VERIFIED BADGE</Text>
        </View>
        <Text className="text-center font-label text-[13px] text-midnight/60">{instructions}</Text>
      </View>
    </View>
  );
}
