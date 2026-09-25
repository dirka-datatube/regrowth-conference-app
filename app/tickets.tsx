import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

import { TabScreen, Section } from '@/components/TabScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { BadgeCard } from '@/components/BadgeCard';
import { NeedHelp } from '@/components/NeedHelp';
import { useAppStore } from '@/lib/store';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { productFor } from '@/lib/events';

/**
 * My Tickets — "Fastpass Entry Gateway" (146:1906). One entry badge per
 * confirmed registration: Navigate's VIP PASS, the Study Tour's VIP DELEGATE.
 *
 * The comp's download button waits on Decision 7 (image, PDF or Wallet pass),
 * planned for Sprint 09.
 */
export default function Tickets() {
  const attendee = useAppStore((s) => s.attendee);
  const { tickets } = useRegistrations();
  const name = attendee?.name ?? '';

  return (
    <TabScreen supportChip={false} header={<ScreenHeader title="My Tickets" subtitle="Fastpass Entry Gateway" />}>
      {tickets.length ? (
        tickets.map((t) => {
          const product = productFor(t.eventId);
          return (
            <Section key={t.eventId} className="px-[30px]">
              <BadgeCard
                name={name}
                eventLabel={product?.short ?? 'Event'}
                tier={t.ticketTier}
                qrToken={t.qrToken}
                instructions={product?.entry}
              />
            </Section>
          );
        })
      ) : (
        <Section>
          <View className="items-center gap-y-3 rounded-card border border-card-line bg-well p-6">
            <Text className="text-center font-data text-[18px] font-bold text-snow">No active tickets</Text>
            <Text className="text-center font-data text-[13px] text-quiet">
              When you register for an event, your entry badge appears here.
            </Text>
            <Pressable
              onPress={() => router.navigate('/events')}
              accessibilityRole="button"
              className="mt-1 rounded-cta bg-ocean px-4 py-2"
            >
              <Text className="font-data text-[12px] font-semibold text-snow">View Events</Text>
            </Pressable>
          </View>
        </Section>
      )}

      <Section>
        <NeedHelp />
      </Section>
    </TabScreen>
  );
}
