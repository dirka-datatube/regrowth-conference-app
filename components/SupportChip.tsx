import { View, Text, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUPPORT, openSupport } from '@/lib/content';
import { colors } from '@/lib/theme';

/**
 * Floating "Send us a message" chip — bottom-right, 22px above the tab bar,
 * on Home, Events and Profile (132:727).
 */

const shadow = Platform.select({
  web: { boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.2)' },
  default: {
    shadowColor: colors.basalt,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
}) as object;

export function SupportChip() {
  return (
    <Pressable
      onPress={openSupport}
      accessibilityRole="button"
      accessibilityLabel="Send the REGROWTH team a message"
      style={shadow}
      className="absolute bottom-[109px] right-[13px] w-[155px] flex-row items-center justify-center gap-x-2 rounded-badge border border-card-line bg-chip-teal px-3.5 py-2.5 backdrop-blur"
    >
      <View className="h-7 w-7 items-center justify-center rounded-pill bg-snow/20">
        <Ionicons name="chatbubble-ellipses" size={15} color={colors.snow} />
      </View>
      <View className="gap-y-px">
        <Text className="font-ui text-[11px] font-semibold text-snow">{SUPPORT.name}</Text>
        <Text className="font-ui text-[9px] font-medium text-snow/85">Send us a message</Text>
      </View>
    </Pressable>
  );
}
