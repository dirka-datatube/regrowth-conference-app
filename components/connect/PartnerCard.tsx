import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PartnerLogo } from './PartnerLogo';
import { Pills } from './Pills';
import { FeatureButton } from '@/components/FeatureCard';
import type { PartnerSummary } from '@/lib/hooks/usePartners';
import { colors } from '@/lib/theme';

/** A partner in the list (173:720): logo, name, one-line pitch, categories. */
export function PartnerCard({ partner, onPress }: { partner: PartnerSummary; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${partner.name}${partner.description ? `. ${partner.description}` : ''}`}
      className="flex-row items-center gap-x-3.5 rounded-card border border-hairline bg-tile p-4"
    >
      <PartnerLogo name={partner.name} uri={partner.logo_url} />
      <View className="flex-1 gap-y-1.5">
        <Text className="font-data text-[15px] font-bold text-snow" numberOfLines={1}>
          {partner.name}
        </Text>
        {!!partner.description && (
          <Text className="font-data text-[12px] leading-[17px] text-lede" numberOfLines={2}>
            {partner.description}
          </Text>
        )}
        <Pills items={partner.tags ?? []} max={2} />
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.snow} />
    </Pressable>
  );
}

/**
 * The featured partner, first on the page — CommBank in the comp (185:550).
 * A photo card in the comp; the scrim and a large logo tile stand in until the
 * imagery is exported (Sprint 12).
 */
export function FeaturedPartnerCard({ partner, onPress }: { partner: PartnerSummary; onPress: () => void }) {
  return (
    <View className="overflow-hidden rounded-feature border border-hairline bg-scrim-strong">
      <View className="h-[132px] flex-row items-center justify-center gap-x-4 bg-ocean/30">
        <PartnerLogo name={partner.name} uri={partner.logo_url} size={76} />
        <Text className="font-data text-[20px] text-snow/70">×</Text>
        <Text className="font-data text-[18px] font-bold tracking-wide text-snow">REGROWTH®</Text>
      </View>
      <View className="gap-y-2 px-5 pb-5 pt-4">
        <Text className="font-label text-[11px] font-bold uppercase tracking-widest text-earth">Featured partner</Text>
        <Text className="font-data text-[20px] font-semibold text-snow">{partner.name}</Text>
        {!!partner.description && (
          <Text className="font-body text-[13px] leading-[19px] text-snow" numberOfLines={3}>
            {partner.description}
          </Text>
        )}
        <Pills items={partner.tags ?? []} />
        <View className="mt-2">
          <FeatureButton label="View Partner" onPress={onPress} />
        </View>
      </View>
    </View>
  );
}
