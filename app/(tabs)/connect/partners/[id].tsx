import { View, Text, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { MenuRow } from '@/components/MenuRow';
import { CtaButton } from '@/components/connect/CtaButton';
import { PartnerLogo } from '@/components/connect/PartnerLogo';
import { Pills } from '@/components/connect/Pills';
import { NoticeCard, Loading } from '@/components/connect/NoticeCard';
import { tagLabel, usePartner, usePartnerInterest } from '@/lib/hooks/usePartners';
import { colors } from '@/lib/theme';

/**
 * A partner's page — the comp is CommBank (185:550), with no layer tree here,
 * so it is built from the frame and the v2 patterns; re-check against 185:550
 * when Figma reads are available. It replaces the pre-v2 app/commbank.tsx:
 * every partner gets this page, and the admin panel's partner row fills it.
 *
 * The hero is a photo card in the comp; the scrim and the logo lockup stand
 * in until the imagery is exported (Sprint 12).
 */

function host(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function PartnerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { partner, isLoading } = usePartner(id);
  const { registered, register } = usePartnerInterest(partner);

  if (isLoading || !partner) {
    return (
      <SubScreen title="REGROWTH Partners" subtitle="Explore our trusted partners">
        <Section>
          {isLoading ? (
            <Loading label="Loading partner…" />
          ) : (
            <NoticeCard
              icon="business-outline"
              title="This partner isn’t available"
              body="They may no longer be partnering with your event."
              action={{ label: 'All partners', onPress: () => router.navigate('/connect/partners') }}
            />
          )}
        </Section>
      </SubScreen>
    );
  }

  const kind = partner.tags?.[0] ? `${tagLabel(partner.tags[0])} partner` : 'REGROWTH partner';

  return (
    <SubScreen title={partner.name} subtitle={`${kind} of REGROWTH`}>
      <Section>
        <View className="h-[184px] items-center justify-center gap-y-3 overflow-hidden rounded-feature border border-hairline bg-scrim-strong">
          <View className="absolute inset-0 bg-ocean/30" />
          <PartnerLogo name={partner.name} uri={partner.logo_url} size={88} />
          <Text className="font-data text-[16px] font-semibold text-snow">
            {partner.name} × REGROWTH®
          </Text>
        </View>
      </Section>

      <Section className="gap-y-3">
        <SectionHeading title="About" />
        {!!partner.description && (
          <Text className="font-body text-[14px] leading-[21px] text-lede">{partner.description}</Text>
        )}
        <Pills items={partner.tags ?? []} />
      </Section>

      {!!partner.solutions_content && (
        <Section className="gap-y-3">
          <SectionHeading title="Solutions for your business" />
          <Text className="font-body text-[14px] leading-[21px] text-lede">{partner.solutions_content}</Text>
        </Section>
      )}

      <Section className="gap-y-2">
        {registered ? (
          <View className="h-12 flex-row items-center justify-center gap-x-2 rounded-cta border border-card-line">
            <Ionicons name="checkmark-circle" size={18} color={colors.snow} />
            <Text className="font-data text-[13px] font-semibold text-snow">Interest registered</Text>
          </View>
        ) : (
          <CtaButton
            wide
            icon="hand-right-outline"
            label="Register interest"
            busy={register.isPending}
            onPress={() => register.mutate()}
          />
        )}
        <Text className="text-center font-data text-[12px] leading-[17px] text-quiet">
          {registered
            ? `We’ve passed your details to ${partner.name}. They’ll be in touch.`
            : `We’ll share your name and email with ${partner.name} so they can follow up.`}
        </Text>
        {register.isError && (
          <Text className="text-center font-data text-[12px] text-snow">That didn’t go through. Try again in a moment.</Text>
        )}
      </Section>

      {(!!partner.website_url || !!partner.contact_email) && (
        <Section className="gap-y-3">
          <SectionHeading title="Get in touch" />
          {!!partner.website_url && (
            <MenuRow
              icon="globe-outline"
              title="Website"
              subtitle={host(partner.website_url)}
              onPress={() => Linking.openURL(partner.website_url!)}
            />
          )}
          {!!partner.contact_email && (
            <MenuRow
              icon="mail-outline"
              title="Email"
              subtitle={partner.contact_email}
              onPress={() => Linking.openURL(`mailto:${partner.contact_email}`)}
            />
          )}
        </Section>
      )}
    </SubScreen>
  );
}
