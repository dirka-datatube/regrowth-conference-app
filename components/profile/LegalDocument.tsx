import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_DRAFT_NOTICE, type LegalDoc } from '@/lib/legal';
import { colors } from '@/lib/theme';

/**
 * Long-form legal copy — Privacy Policy (227:2808), Terms & Conditions
 * (227:2863): Inter headings over Butler body, with the draft banner on top
 * until REGROWTH supplies the final wording (lib/legal.ts).
 */
export function LegalDocument({
  doc,
  related,
}: {
  doc: LegalDoc;
  /** A link to the other document at the foot. */
  related?: { label: string; onPress: () => void };
}) {
  return (
    <View className="gap-y-6">
      <View
        accessibilityRole="alert"
        className="flex-row items-center gap-x-2.5 rounded-cta border border-alert-reminder/50 bg-alert-reminder/10 px-3.5 py-2.5"
      >
        <Ionicons name="alert-circle-outline" size={18} color={colors.alertReminder} />
        <Text className="flex-1 font-data text-[12px] font-semibold text-snow">{LEGAL_DRAFT_NOTICE}</Text>
      </View>

      <Text className="font-body text-[15px] leading-[23px] text-lede">{doc.intro}</Text>

      {doc.sections.map((section, i) => (
        <View key={section.heading} className="gap-y-2.5">
          <Text accessibilityRole="header" className="font-data text-[16px] font-bold text-snow">
            {i + 1}. {section.heading}
          </Text>
          {section.blocks.map((block, j) =>
            typeof block === 'string' ? (
              <Text key={j} className="font-body text-[14px] leading-[22px] text-lede">
                {block}
              </Text>
            ) : (
              <View key={j} className="gap-y-2">
                {block.map((item) => (
                  <View key={item} className="flex-row gap-x-2.5 pr-1">
                    <Text className="font-body text-[14px] leading-[22px] text-quiet">•</Text>
                    <Text className="flex-1 font-body text-[14px] leading-[22px] text-lede">{item}</Text>
                  </View>
                ))}
              </View>
            ),
          )}
        </View>
      ))}

      {related && (
        <Pressable
          onPress={related.onPress}
          accessibilityRole="link"
          className="flex-row items-center justify-between rounded-tile border border-card-line p-4"
        >
          <Text className="font-data text-[14px] font-semibold text-snow">{related.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.snow} />
        </Pressable>
      )}
    </View>
  );
}
