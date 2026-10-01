import { useMemo, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SearchField } from '@/components/SearchField';
import { SectionHeading } from '@/components/SectionHeading';
import { NeedHelp } from '@/components/NeedHelp';
import { AttendeeCard } from '@/components/connect/AttendeeCard';
import { HeaderIconButton } from '@/components/connect/HeaderIconButton';
import { NoticeCard, Loading } from '@/components/connect/NoticeCard';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { matchesMember, useCommunityConnections, useCommunityMembers } from '@/lib/hooks/useCommunity';
import { productFor } from '@/lib/events';
import { colors } from '@/lib/theme';

/**
 * An event's community — Connect → Attendees, Navigate (189:540) and Study
 * Tour (211:660). Built from the frame names, their 957px height and the v2
 * patterns; re-check against those nodes when Figma reads are available.
 *
 * Communities open with registration: without a confirmed registration for
 * this event the list is replaced by a locked card that points to Events.
 * The scan button in the header is the in-person way to connect (a badge scan).
 */
export default function Community() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const product = productFor(eventId ?? '');
  const eventName = product?.short ?? 'Event';
  const { isRegisteredFor } = useRegistrations();
  const open = !!eventId && isRegisteredFor(eventId);

  const [q, setQ] = useState('');
  const { members, isLoading, isError, isRefetching, refetch } = useCommunityMembers(eventId, open);
  const connectedIds = useCommunityConnections();
  const shown = useMemo(() => members.filter((m) => matchesMember(m, q)), [members, q]);

  const count = shown.length;
  const heading = q.trim()
    ? `${count} ${count === 1 ? 'match' : 'matches'}`
    : `${count} ${count === 1 ? 'person' : 'people'} going to ${eventName}`;

  return (
    <SubScreen
      title={`${eventName} Community`}
      subtitle="Connect with fellow attendees"
      right={open ? <HeaderIconButton icon="scan-outline" label="Scan a badge" onPress={() => router.push('/scan')} /> : undefined}
      refreshControl={
        open ? <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.earth} /> : undefined
      }
    >
      {!open ? (
        <Section>
          <NoticeCard
            icon="lock-closed-outline"
            title="Communities open with registration"
            body={`Register for ${eventName} to meet the people going, swap details and connect before you arrive.`}
            action={{ label: 'View Events', onPress: () => router.navigate('/events') }}
          />
        </Section>
      ) : (
        <>
          <Section>
            <SearchField
              value={q}
              onChangeText={setQ}
              placeholder="Search by name, role or company"
              voiceAvailable={false}
            />
          </Section>

          <Section className="gap-y-3">
            {isLoading ? (
              <Loading label="Loading attendees…" />
            ) : isError ? (
              <NoticeCard
                icon="cloud-offline-outline"
                title="Couldn’t load the community"
                body="Check your connection and try again."
                action={{ label: 'Try again', onPress: () => refetch() }}
              />
            ) : members.length === 0 ? (
              <NoticeCard
                icon="people-outline"
                title="You’re one of the first here"
                body={`As more people register for ${eventName}, they’ll appear here.`}
              />
            ) : (
              <>
                <SectionHeading title="Attendees" subtitle={heading} />
                <View className="gap-y-3">
                  {shown.map((m) => (
                    <AttendeeCard
                      key={m.id}
                      member={m}
                      connected={connectedIds.includes(m.id)}
                      onPress={() => router.push(`/connect/attendee/${m.id}` as never)}
                    />
                  ))}
                </View>
                {count === 0 && (
                  <NoticeCard icon="search-outline" title="No one matches that" body="Try a name, a company, or an interest like “sales”." />
                )}
              </>
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
