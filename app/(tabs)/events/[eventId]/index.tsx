import { useState } from 'react';
import { View, Linking, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import type { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SearchField } from '@/components/SearchField';
import { SectionHeading } from '@/components/SectionHeading';
import { QuickAccessGrid, type QuickAccessItem } from '@/components/QuickAccessGrid';
import { NeedHelp } from '@/components/NeedHelp';
import { QrModal } from '@/components/QrModal';
import { EventBell } from '@/components/event/EventBell';
import { PersonCard } from '@/components/event/PersonCard';
import { CountdownBanner } from '@/components/event/CountdownBanner';
import { UpdateCard } from '@/components/event/UpdateCard';
import { SpeakerRow } from '@/components/event/SpeakerRow';
import { InfoCard } from '@/components/event/InfoCard';
import { GuideEmpty } from '@/components/event/GuideState';
import { useAppStore } from '@/lib/store';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { useEvent, useEventClock } from '@/lib/hooks/useEvent';
import { useEventFeed } from '@/lib/hooks/useEventFeed';
import { useSpeakers } from '@/lib/hooks/useSpeakers';
import { eventHref, productFor, type EventScreen } from '@/lib/events';
import { agendaHref, firstName, searchHint, speakerHref, type FeedItem } from '@/lib/eventContent';
import { greeting } from '@/lib/eventTime';
import { colors } from '@/lib/theme';

/**
 * Event home — Navigate Home (146:2498) and Study Tour Home (211:872), which
 * are the same frame with different copy, so one screen serves every event.
 *
 * Greeting and bell, search (hands off to the agenda), the attendee's card
 * with their badge QR for this event, Quick Access, the countdown, What's
 * Coming, featured speakers and the six info boxes, then Need Help.
 */

type Icon = keyof typeof Ionicons.glyphMap;

const INFO: { title: string; body: string; cta: string; icon: Icon; screen?: EventScreen; href?: string }[] = [
  {
    title: 'Agenda',
    body: 'Stay on top of every session, activity & event highlights',
    cta: 'View Agenda',
    icon: 'calendar-outline',
    screen: 'agenda',
  },
  // The comp's Venue Map box has no copy; this line is ours.
  {
    title: 'Venue Map',
    body: 'Find your way around every level of the venue',
    cta: 'View Venue Map',
    icon: 'map-outline',
    screen: 'map',
  },
  {
    title: 'Hotel & Accommodation',
    // The comp reads "booking formation"; "information" is meant.
    body: 'Accommodation & booking information for your stay',
    cta: 'View Accommodation',
    icon: 'bed-outline',
    screen: 'hotel',
  },
  {
    title: 'What To Pack / Bring',
    body: 'Everything you need to prepare',
    cta: 'Prepare For Your Trip',
    icon: 'briefcase-outline',
    screen: 'pack',
  },
  {
    title: 'Weather',
    body: 'Check latest forecast before you arrive',
    cta: 'View Forecast',
    icon: 'partly-sunny-outline',
    screen: 'weather',
  },
  {
    title: 'REGROWTH Partners',
    body: 'Connect with industry-leading partners',
    cta: 'Meet Our Partners',
    icon: 'business-outline',
    href: '/connect/partners',
  },
];

function quickAccess(eventId: string): QuickAccessItem[] {
  return [
    { label: 'Agenda', icon: 'calendar-outline', href: eventHref(eventId, 'agenda') },
    { label: 'Speakers', icon: 'mic-outline', href: eventHref(eventId, 'speakers') },
    { label: 'Venue Map', icon: 'map-outline', href: eventHref(eventId, 'map') },
    { label: 'Accommodation', icon: 'bed-outline', href: eventHref(eventId, 'hotel') },
    { label: 'What to Pack', icon: 'briefcase-outline', href: eventHref(eventId, 'pack') },
    { label: 'Weather', icon: 'rainy-outline', href: eventHref(eventId, 'weather') },
  ];
}

export default function EventHome() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const attendee = useAppStore((s) => s.attendee);
  const { tickets, isRegisteredFor } = useRegistrations();
  const { event } = useEvent(eventId);
  const { data: speakers } = useSpeakers(eventId);
  const feed = useEventFeed(event);
  const now = useEventClock();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const ticket = isRegisteredFor(eventId) ? tickets.find((t) => t.eventId === eventId) : undefined;
  const profile = useAppStore((s) => s.profile);
  const name = attendee?.name ?? '';
  const first = firstName(profile?.first_name || name);

  async function refresh() {
    setRefreshing(true);
    await Promise.all(
      [['event', eventId], ['guide-sessions', eventId], ['guide-speakers', eventId]].map((queryKey) =>
        qc.invalidateQueries({ queryKey }),
      ),
    );
    setRefreshing(false);
  }

  function open(item: FeedItem) {
    if (!item.link) return;
    if ('href' in item.link) router.push(item.link.href as never);
    else Linking.openURL(item.link.url).catch(() => {});
  }

  return (
    <SubScreen
      title={first ? `${greeting(now)}, ${first}` : greeting(now)}
      subtitle={`Welcome to ${event.title}`}
      right={<EventBell />}
      supportChip
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.earth} />}
    >
      <Section>
        <SearchField
          value={q}
          onChangeText={setQ}
          onSubmit={() => router.push(agendaHref(eventId, q) as never)}
          placeholder={searchHint(eventId)}
          voiceAvailable={false}
        />
      </Section>

      <Section>
        <PersonCard
          name={name || 'Your profile'}
          line={[attendee?.role, attendee?.company].filter(Boolean).join(' | ')}
          photoUrl={attendee?.photo_url}
          chip={ticket ? { label: 'View My QR Code', icon: 'qr-code-outline', onPress: () => setShowQr(true) } : null}
        />
      </Section>

      <Section className="gap-y-3">
        <SectionHeading title="Quick Access" />
        <QuickAccessGrid items={quickAccess(eventId)} />
      </Section>

      <CountdownBanner event={event} now={now} />

      <Section className="gap-y-3">
        <SectionHeading title="🔔 What’s Coming" />
        {feed.length ? (
          feed.map((item) => (
            <UpdateCard key={item.key} item={item} onOpen={item.link ? () => open(item) : undefined} />
          ))
        ) : (
          <GuideEmpty
            icon="notifications-outline"
            title="No updates yet"
            body={`News from the REGROWTH team about ${event.short} will appear here.`}
          />
        )}
      </Section>

      {!!speakers?.length && (
        <View className="gap-y-3">
          <Section>
            <SectionHeading title={`Featured Speakers at ${event.short}`} />
          </Section>
          <SpeakerRow
            speakers={speakers.slice(0, 8)}
            onOpen={(s) => router.push(speakerHref(eventId, s.id) as never)}
          />
        </View>
      )}

      <Section className="gap-y-[18px]">
        {INFO.map((card) => (
          <InfoCard
            key={card.title}
            title={card.title}
            body={card.body}
            cta={card.cta}
            icon={card.icon}
            onPress={() => router.push((card.screen ? eventHref(eventId, card.screen) : card.href!) as never)}
          />
        ))}
      </Section>

      <Section>
        <NeedHelp />
      </Section>

      {showQr && ticket && (
        <QrModal
          token={ticket.qrToken}
          name={name}
          subtitle={[event.short, ticket.ticketTier].filter(Boolean).join(' · ')}
          note={productFor(eventId)?.entry ?? 'Present this QR code at registration.'}
          onClose={() => setShowQr(false)}
        />
      )}
    </SubScreen>
  );
}
