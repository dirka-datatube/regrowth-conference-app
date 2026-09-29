import { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SearchField } from '@/components/SearchField';
import { SectionHeading } from '@/components/SectionHeading';
import { MenuRow } from '@/components/MenuRow';
import { NoticeCard } from '@/components/connect/NoticeCard';

/**
 * Find A Referral (206:563). The comp's body reads "MISSING CONTENT INFO —
 * Will check with Kylie and Lauren", and the product is undefined (Decision 5
 * on the design epic), so this is the header and search from the frame over
 * an honest coming-soon state — no invented referral product.
 *
 * What someone types in the search is not thrown away: "Tell us what you're
 * looking for" carries it into the support chat, where the team sees it.
 */
export default function Referral() {
  const [q, setQ] = useState('');
  const wanted = q.trim();

  function tellUs() {
    const draft = wanted ? `I’m looking for a referral: ${wanted}` : 'I’m looking for a referral: ';
    router.push({ pathname: '/support', params: { draft } });
  }

  return (
    <SubScreen title="Find A Referral" subtitle="Connect with trusted industry network">
      <Section>
        <SearchField
          value={q}
          onChangeText={setQ}
          onSubmit={tellUs}
          placeholder="What kind of professional do you need?"
          voiceAvailable={false}
        />
      </Section>

      <Section>
        <NoticeCard
          icon="git-network-outline"
          title="Referrals are on their way"
          body="We’re finalising the REGROWTH referral network — trusted recommendations from professionals across the community."
          action={{ label: 'Tell us what you’re looking for', icon: 'chatbubble-ellipses-outline', onPress: tellUs }}
        >
          {!!wanted && (
            <Text className="text-center font-data text-[13px] text-snow">
              Looking for “{wanted}”? Send it to the team and they’ll keep it in mind.
            </Text>
          )}
        </NoticeCard>
      </Section>

      <Section className="gap-y-3">
        <SectionHeading title="In the meantime" subtitle="Ways to meet the right people today." />
        <MenuRow
          icon="business-outline"
          title="REGROWTH Partners"
          subtitle="Explore our trusted partners"
          onPress={() => router.push('/connect/partners')}
        />
        <MenuRow
          icon="people-outline"
          title="Attendee Networking"
          subtitle="Connect with fellow attendees"
          onPress={() => router.navigate('/connect')}
        />
      </Section>
    </SubScreen>
  );
}
