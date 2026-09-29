import { useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SearchField } from '@/components/SearchField';
import { SectionHeading } from '@/components/SectionHeading';
import { Chip } from '@/components/Chip';
import { NeedHelp } from '@/components/NeedHelp';
import { PartnerCard, FeaturedPartnerCard } from '@/components/connect/PartnerCard';
import { NoticeCard, Loading } from '@/components/connect/NoticeCard';
import { matchesPartner, tagLabel, usePartners } from '@/lib/hooks/usePartners';
import { colors } from '@/lib/theme';

/**
 * REGROWTH Partners (173:720). The frame is 3372px tall — a long list — and
 * has no layer tree here, so it is built from the frame name and the v2
 * patterns; re-check against 173:720 when Figma reads are available.
 *
 * Search and category chips (from the partners' tags) narrow the list. The
 * featured partner leads the unfiltered page; while filtering it takes its
 * place in the results.
 */
export default function Partners() {
  const { partners, isLoading, isError, isRefetching, refetch } = usePartners();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(partners.flatMap((p) => p.tags ?? []))].sort(), [partners]);
  const filtering = !!q.trim() || !!category;
  const featured = filtering ? undefined : partners.find((p) => p.is_featured);
  const list = partners.filter(
    (p) => p !== featured && matchesPartner(p, q) && (!category || (p.tags ?? []).includes(category)),
  );

  const open = (id: string) => router.push(`/connect/partners/${id}` as never);

  return (
    <SubScreen
      title="REGROWTH Partners"
      subtitle="Explore our trusted partners"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.earth} />}
    >
      <Section>
        <SearchField value={q} onChangeText={setQ} placeholder="Search partners" voiceAvailable={false} />
      </Section>

      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, columnGap: 8 }}
        >
          <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
          {categories.map((c) => (
            <Chip key={c} label={tagLabel(c)} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <Section>
          <Loading label="Loading partners…" />
        </Section>
      ) : isError ? (
        <Section>
          <NoticeCard
            icon="cloud-offline-outline"
            title="Couldn’t load our partners"
            body="Check your connection and try again."
            action={{ label: 'Try again', onPress: refetch }}
          />
        </Section>
      ) : partners.length === 0 ? (
        <Section>
          <NoticeCard
            icon="business-outline"
            title="No partners to show yet"
            body="Partners appear here once they’re announced for an event you’re registered for."
          />
        </Section>
      ) : (
        <>
          {featured && (
            <Section>
              <FeaturedPartnerCard partner={featured} onPress={() => open(featured.id)} />
            </Section>
          )}

          <Section className="gap-y-3">
            <SectionHeading
              title={filtering ? 'Results' : 'All Partners'}
              subtitle={`${list.length} ${list.length === 1 ? 'partner' : 'partners'}`}
            />
            <View className="gap-y-3">
              {list.map((p) => (
                <PartnerCard key={p.id} partner={p} onPress={() => open(p.id)} />
              ))}
            </View>
            {list.length === 0 && (
              <NoticeCard icon="search-outline" title="No partners match" body="Try another search or category." />
            )}
          </Section>
        </>
      )}

      <Section>
        <NeedHelp />
      </Section>
    </SubScreen>
  );
}
