import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Ticket card — the Events tab when registered (134:973): who the ticket is
 * for, the tier, and the way to the entry QR.
 */

const lift = Platform.select({
  web: { boxShadow: '0px 12px 12px 0px rgba(0,0,0,0.25)' },
  default: {
    shadowColor: colors.basalt,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
}) as object;

export function TicketCard({
  name,
  tier,
  onShowQr,
}: {
  name: string;
  tier: string | null;
  onShowQr: () => void;
}) {
  return (
    <View style={lift} className="gap-y-[13px] rounded-card bg-cloud px-6 pb-[14px] pt-[25px]">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-y-1">
          <Text className="font-data text-[20px] font-bold text-midnight" numberOfLines={1}>
            {name}
          </Text>
          {tier && (
            <Text className="font-label text-[12px] font-bold uppercase text-midnight/60">{tier}</Text>
          )}
        </View>
        <Ionicons name="star-outline" size={24} color={colors.midnight} />
      </View>

      <Pressable
        onPress={onShowQr}
        accessibilityRole="button"
        className="h-[52px] flex-row items-center justify-center gap-x-3 rounded-tile bg-midnight px-4"
      >
        <Ionicons name="qr-code-outline" size={20} color={colors.snow} />
        <Text className="font-label text-[14px] font-bold text-snow">View My QR Code</Text>
      </Pressable>
    </View>
  );
}
