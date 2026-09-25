import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeading } from './SectionHeading';
import { SUPPORT, openSupport } from '@/lib/content';
import { colors } from '@/lib/theme';

/** "Need Help?" — closes Home, Events and Profile (132:671). */
export function NeedHelp() {
  return (
    <View className="gap-y-3">
      <SectionHeading title="Need Help?" subtitle="Contact the REGROWTH team." />
      <View className="gap-y-3 rounded-card border border-hairline bg-tile p-4 backdrop-blur">
        <View className="flex-row items-center gap-x-3">
          {/* Staff photo in the comp; initials until the real contact is set. */}
          <View className="h-11 w-11 items-center justify-center rounded-pill bg-ocean">
            <Text className="font-data text-[15px] font-bold text-snow">RG</Text>
          </View>
          <View className="flex-1 gap-y-0.5">
            <Text className="font-data text-[15px] font-bold text-snow">{SUPPORT.name}</Text>
            <Text className="font-data text-[12px] text-quiet">{SUPPORT.role}</Text>
          </View>
        </View>
        <Pressable
          onPress={openSupport}
          accessibilityRole="button"
          className="flex-row items-center justify-center gap-x-2 rounded-cta bg-ocean px-4 py-2.5"
        >
          <Ionicons name="chatbox-outline" size={16} color={colors.snow} />
          <Text className="font-data text-[13px] font-semibold text-snow">Chat with Us</Text>
        </Pressable>
      </View>
    </View>
  );
}
