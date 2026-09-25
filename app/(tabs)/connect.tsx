import { View } from 'react-native';
import { router } from 'expo-router';

import { TabScreen } from '@/components/TabScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { FeatureCard, FeatureButton } from '@/components/FeatureCard';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { NAVIGATE, STUDY_TOUR } from '@/lib/events';

/**
 * Connect — Figma v2 (92:212) and its REGISTERED variant (137:1261).
 *
 * Four photo cards. Each event's community is locked until the attendee is
 * registered for that event; a locked button goes to Events, where
 * registration starts. The community itself becomes per-event in Sprint 11
 * (Attendees 189:540 / 211:660); until then it opens the attendee directory,
 * which RLS already scopes to the attendee's own event.
 *
 * Find a Referral has no product definition yet (Decision 5 on the design
 * epic), so its button is shown but inert.
 */

const COMMUNITIES = [
  { product: NAVIGATE, tone: 'ocean' as const },
  { product: STUDY_TOUR, tone: 'earth' as const },
];

export default function Connect() {
  const { isRegisteredFor } = useRegistrations();

  return (
    <TabScreen
      supportChip={false}
      header={
        <ScreenHeader
          title="Connect"
          subtitle="Everything you need to connect, collaborate & grow"
          back={false}
        />
      }
    >
      <View className="gap-y-4 px-3.5">
        <FeatureCard
          title="Attendee Networking"
          body="Network, collaborate and engage with fellow attendees before, during and after your event."
        >
          {COMMUNITIES.map(({ product, tone }) => {
            const open = isRegisteredFor(product.id);
            return (
              <FeatureButton
                key={product.id}
                label={`${product.short} Community`}
                tone={tone}
                locked={!open}
                onPress={() =>
                  open ? router.push(`/attendees?event=${product.id}` as never) : router.navigate('/events')
                }
              />
            );
          })}
        </FeatureCard>

        <FeatureCard
          title="Find A Referral"
          body="Discover trusted recommendations and connect with professionals across the community."
        >
          <FeatureButton label="Explore Opportunities" />
        </FeatureCard>

        <FeatureCard
          title="Impact & Influence Podcast"
          body="Listen to inspiring conversations, leadership insights and real-world success stories."
        >
          <FeatureButton label="Start Listening Now" onPress={() => router.push('/podcast')} />
        </FeatureCard>

        <FeatureCard
          title="REGROWTH Partners"
          body="Explore our trusted partners and discover solutions to support your business growth."
        >
          <FeatureButton label="Meet Our Partners" onPress={() => router.push('/partners')} />
        </FeatureCard>
      </View>
    </TabScreen>
  );
}
