import { useState } from 'react';
import { Text } from 'react-native';

import { TabScreen, Section } from '@/components/TabScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EventHeroPager } from '@/components/EventHeroPager';
import { TicketCard } from '@/components/TicketCard';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { ContinueLearning } from '@/components/ContinueLearning';
import { NeedHelp } from '@/components/NeedHelp';
import { QrModal } from '@/components/QrModal';
import { useAppStore } from '@/lib/store';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { PRODUCTS, type Product } from '@/lib/events';

/**
 * Events — Figma v2 (129:420) and its REGISTERED variant (134:819).
 *
 * One featured event at a time, swiping to the next ("Choose an event to get
 * started"). Under the hero, a registered attendee gets that event's ticket;
 * everyone else gets its registrations-open banner. August's "Beyond Events"
 * row became Continue Learning.
 */
export default function Events() {
  const attendee = useAppStore((s) => s.attendee);
  const { tickets, isRegisteredFor } = useRegistrations();
  const [showQr, setShowQr] = useState(false);
  const [product, setProduct] = useState<Product>(PRODUCTS[0]);

  const registered = isRegisteredFor(product.id);
  const ticket = tickets.find((t) => t.eventId === product.id);
  const name = attendee?.name ?? '';

  return (
    <TabScreen header={<ScreenHeader title="Events" subtitle="Choose an event to get started" back={false} />}>
      <Section className="gap-y-2">
        <Text className="text-center font-data text-[16px] text-snow">Welcome to REGROWTH events!</Text>
        <Text className="text-center font-body text-[13px] text-snow">
          Everything you need for your event experience in one place. Explore upcoming events and get started.
        </Text>
      </Section>

      <EventHeroPager products={PRODUCTS} isRegistered={isRegisteredFor} onChange={setProduct} />

      {registered && ticket ? (
        <Section>
          <TicketCard name={name} tier={ticket.ticketTier} onShowQr={() => setShowQr(true)} />
        </Section>
      ) : (
        // Registration is sold on the website; Sprint 09 links this to checkout.
        <AnnouncementBanner text={`📣 ${product.short} registrations are now open • Secure your spot`} />
      )}

      <Section>
        <ContinueLearning />
      </Section>

      <Section>
        <NeedHelp />
      </Section>

      {showQr && ticket && (
        <QrModal
          token={ticket.qrToken}
          name={name}
          subtitle={[product.short, ticket.ticketTier].filter(Boolean).join(' · ')}
          note={product.entry}
          onClose={() => setShowQr(false)}
        />
      )}
    </TabScreen>
  );
}
