import { useState } from 'react';
import { Text } from 'react-native';

import { TabScreen, Section } from '@/components/TabScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EventHero } from '@/components/EventHero';
import { TicketCard } from '@/components/TicketCard';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { ContinueLearning } from '@/components/ContinueLearning';
import { NeedHelp } from '@/components/NeedHelp';
import { QrModal } from '@/components/QrModal';
import { useAppStore } from '@/lib/store';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { NAVIGATE } from '@/lib/events';

/**
 * Events — Figma v2 (129:420) and its REGISTERED variant (134:819).
 *
 * v2 replaces August's two-event carousel and "Beyond Events" row with one
 * featured event. Registered attendees get their ticket under the hero;
 * everyone else gets the registrations-open banner. "Beyond Events" became
 * Continue Learning.
 */
export default function Events() {
  const attendee = useAppStore((s) => s.attendee);
  const { tickets, isRegisteredFor } = useRegistrations();
  const [showQr, setShowQr] = useState(false);

  const registered = isRegisteredFor(NAVIGATE.id);
  const ticket = tickets.find((t) => t.eventId === NAVIGATE.id);
  const name = attendee?.name ?? '';

  return (
    <TabScreen header={<ScreenHeader title="Events" subtitle="Choose an event to get started" back={false} />}>
      <Section className="gap-y-2">
        <Text className="text-center font-data text-[16px] text-snow">Welcome to REGROWTH events!</Text>
        <Text className="text-center font-body text-[13px] text-snow">
          Everything you need for your event experience in one place. Explore upcoming events and get started.
        </Text>
      </Section>

      <EventHero product={NAVIGATE} registered={registered} />

      {registered && ticket ? (
        <Section>
          <TicketCard name={name} tier={ticket.ticketTier} onShowQr={() => setShowQr(true)} />
        </Section>
      ) : (
        // Registration is sold on the website; Sprint 09 links this to checkout.
        <AnnouncementBanner text={`📣 ${NAVIGATE.short} registrations are now open • Secure your spot`} />
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
          subtitle={[NAVIGATE.short, ticket.ticketTier].filter(Boolean).join(' · ')}
          note="Present this QR code at the registration desk to gain entry."
          onClose={() => setShowQr(false)}
        />
      )}
    </TabScreen>
  );
}
