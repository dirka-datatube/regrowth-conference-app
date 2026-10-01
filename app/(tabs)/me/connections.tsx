import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { SearchField } from '@/components/SearchField';
import { NeedHelp } from '@/components/NeedHelp';
import { QrModal } from '@/components/QrModal';
import { ActionTiles } from '@/components/profile/ActionTiles';
import { ConnectionCard, BusinessCardRow } from '@/components/profile/ConnectionCard';
import { StatePanel, LoadingLine } from '@/components/profile/StatePanel';
import { CtaButton } from '@/components/profile/CtaButton';
import { useConnections, useConnectionsCards, type Connection } from '@/lib/hooks/useConnections';
import { useAppStore } from '@/lib/store';

/**
 * Networking Connections — Figma v2 (216:1028) and its empty state (217:1330).
 * Built from the frame names and v2 patterns; re-check against 216:1028 and
 * 217:1330 when Figma reads are available.
 *
 * Everyone the attendee has connected with, searchable, with email and
 * LinkedIn one tap away. Scan QR opens the scanner (a badge lands on
 * /c/<token>, which connects and comes back here), My QR shows the attendee's
 * own badge to be scanned, and Scan a Card photographs a business card.
 * Photographed cards not yet matched to an attendee follow the list.
 */

function matches(c: Connection, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (!c.person) return false;
  return [c.person.name, c.person.role, c.person.company].some((f) => f?.toLowerCase().includes(needle));
}

export default function Connections() {
  const me = useAppStore((s) => s.attendee);
  const { data, isLoading, isError, refetch } = useConnections();
  const { data: cards } = useConnectionsCards();
  const [query, setQuery] = useState('');
  const [showQr, setShowQr] = useState(false);

  const connections = useMemo(() => data ?? [], [data]);
  const shown = useMemo(() => connections.filter((c) => matches(c, query)), [connections, query]);
  const count = connections.length;
  const isEmpty = !isLoading && !isError && count === 0 && !cards?.length;

  const scan = () => router.push('/scan');
  const scanCard = () => router.push('/me/card');
  const myQr = me ? () => setShowQr(true) : undefined;

  return (
    <SubScreen
      title="Networking Connections"
      subtitle={data ? `${count} connection${count === 1 ? '' : 's'}` : 'Everyone you have met'}
    >
      {isEmpty ? (
        <Section>
          {/* ICONS — people + QR discs stand in for the comp's illustration. */}
          <StatePanel
            size="large"
            icon="people-outline"
            badge="qr-code-outline"
            title="No connections yet"
            body="Scan someone’s badge to connect. They’ll appear here with their details, ready to follow up."
          >
            <CtaButton label="Scan a Badge" icon="scan-outline" block onPress={scan} />
            {myQr && <CtaButton label="Show My QR Code" icon="qr-code-outline" tone="outline" block onPress={myQr} />}
            <CtaButton label="Scan a Business Card" icon="card-outline" tone="quiet" onPress={scanCard} />
          </StatePanel>
        </Section>
      ) : (
        <>
          <Section>
            <ActionTiles
              items={[
                { label: 'Scan QR', icon: 'scan-outline', onPress: scan, hint: 'Scan a badge to connect' },
                ...(myQr ? [{ label: 'My QR', icon: 'qr-code-outline' as const, onPress: myQr, hint: 'Show your badge to be scanned' }] : []),
                { label: 'Scan a Card', icon: 'card-outline', onPress: scanCard, hint: 'Photograph a business card' },
              ]}
            />
          </Section>

          <Section className="gap-y-3">
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Search connections"
              voiceAvailable={false}
            />
            {isLoading ? (
              <LoadingLine label="Loading your connections…" />
            ) : isError ? (
              <StatePanel icon="cloud-offline-outline" title="We couldn’t load your connections" body="Check your connection and try again.">
                <CtaButton label="Try Again" icon="refresh-outline" onPress={refetch} />
              </StatePanel>
            ) : shown.length ? (
              shown.map((c) => (
                <ConnectionCard
                  key={c.id}
                  person={c.person}
                  onPress={c.person ? () => router.push(`/connect/attendee/${c.person!.id}` as never) : undefined}
                />
              ))
            ) : count ? (
              <Text className="py-6 text-center font-data text-[13px] text-quiet">
                No connections match “{query.trim()}”.
              </Text>
            ) : null}
          </Section>

          {!!cards?.length && (
            <Section className="gap-y-3">
              <SectionHeading
                title="Business Cards"
                subtitle="Cards you’ve photographed, with the details we read from them."
              />
              {cards.map((card) => (
                <BusinessCardRow key={card.id} card={card} />
              ))}
            </Section>
          )}
        </>
      )}

      <Section>
        <NeedHelp />
      </Section>

      {showQr && me && (
        <QrModal
          token={me.qr_token}
          name={me.name}
          subtitle={[me.role, me.company].filter(Boolean).join(' | ') || undefined}
          onClose={() => setShowQr(false)}
        />
      )}
    </SubScreen>
  );
}
