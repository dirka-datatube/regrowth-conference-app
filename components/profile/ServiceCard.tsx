import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CtaButton } from './CtaButton';
import { colors } from '@/lib/theme';

/**
 * A service on REGROWTH Services (217:1795): icon, name and who it is for, a
 * paragraph, what is included, and Enquire. ICONS — Ionicons stand in for the
 * comp's service imagery.
 */

export type Service = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Who it is for, under the title. */
  tagline: string;
  body: string;
  includes: string[];
};

export function ServiceCard({
  service,
  onEnquire,
  secondary,
}: {
  service: Service;
  onEnquire: () => void;
  /** A second action beside Enquire, e.g. View Events. */
  secondary?: { label: string; onPress: () => void };
}) {
  return (
    <View className="gap-y-4 rounded-card border border-hairline bg-tile p-5">
      <View className="flex-row items-center gap-x-3">
        <View className="h-12 w-12 items-center justify-center rounded-tile border border-teal-line bg-teal-wash">
          <Ionicons name={service.icon} size={24} color={colors.snow} />
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text accessibilityRole="header" className="font-data text-[17px] font-bold text-snow">
            {service.title}
          </Text>
          <Text className="font-data text-[12px] text-quiet">{service.tagline}</Text>
        </View>
      </View>

      <Text className="font-body text-[14px] leading-[21px] text-lede">{service.body}</Text>

      <View className="gap-y-2">
        {service.includes.map((item) => (
          <View key={item} className="flex-row items-start gap-x-2.5">
            <Ionicons name="checkmark-circle" size={16} color={colors.switchOn} style={{ marginTop: 1 }} />
            <Text className="flex-1 font-data text-[13px] leading-[18px] text-snow/90">{item}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row flex-wrap gap-3">
        <CtaButton
          label="Enquire"
          icon="chatbubbles-outline"
          onPress={onEnquire}
          accessibilityLabel={`Enquire about ${service.title}`}
        />
        {secondary && <CtaButton label={secondary.label} tone="outline" onPress={secondary.onPress} />}
      </View>
    </View>
  );
}
