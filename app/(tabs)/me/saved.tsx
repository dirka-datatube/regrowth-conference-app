import { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { NeedHelp } from '@/components/NeedHelp';
import { SessionCard } from '@/components/event/SessionCard';
import { DayHeading } from '@/components/profile/DayHeading';
import { StatePanel, LoadingLine } from '@/components/profile/StatePanel';
import { CtaButton } from '@/components/profile/CtaButton';
import { useSavedSessions, useSavedSessionsRemove, type SavedSession } from '@/lib/hooks/useSavedSessions';
import { useEvent } from '@/lib/hooks/useEvent';
import { sessionHref } from '@/lib/eventContent';
import { dayKeyOf, formatDateRange, formatDayHeading } from '@/lib/eventTime';
import { PRODUCTS } from '@/lib/events';

/**
 * Saved Sessions — Figma v2 (216:796). Built from the frame name and v2
 * patterns; re-check against 216:796 when Figma reads are available.
 *
 * Every session the attendee has bookmarked, grouped by event and then by day,
 * on the agenda's own cards (92:288) — times in the event's time zone, as the
 * agenda shows them. The filled bookmark unsaves; a tap opens the session.
 */

type EventGroup = { eventId: string; sessions: SavedSession[] };

/** Events in catalogue order (Navigate, then the Study Tour), anything else after. */
function byEvent(sessions: SavedSession[]): EventGroup[] {
  const rank = (id: string) => {
    const i = PRODUCTS.findIndex((p) => p.id === id);
    return i === -1 ? PRODUCTS.length : i;
  };
  const groups = new Map<string, SavedSession[]>();
  for (const s of sessions) groups.set(s.event_id, [...(groups.get(s.event_id) ?? []), s]);
  return [...groups.entries()]
    .map(([eventId, list]) => ({ eventId, sessions: list }))
    .sort((a, b) => rank(a.eventId) - rank(b.eventId));
}

function EventSessions({ group, onUnsave }: { group: EventGroup; onUnsave: (id: string) => void }) {
  const { event } = useEvent(group.eventId);
  const zone = event.timeZone;

  const days = useMemo(() => {
    const map = new Map<string, SavedSession[]>();
    for (const s of group.sessions) {
      const key = dayKeyOf(s.start_at, zone);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()];
  }, [group.sessions, zone]);

  const count = group.sessions.length;
  const range = days.length ? formatDateRange(days[0][0], days[days.length - 1][0]) : '';

  return (
    <Section className="gap-y-3">
      <SectionHeading
        title={event.short}
        subtitle={[`${count} saved session${count === 1 ? '' : 's'}`, range].filter(Boolean).join(' · ')}
      />
      {days.map(([day, sessions]) => (
        <View key={day} className="gap-y-3">
          <DayHeading label={formatDayHeading(day)} />
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              timeZone={zone}
              saved
              onToggleSave={() => onUnsave(s.id)}
              onPress={() => router.push(sessionHref(group.eventId, s.id) as never)}
            />
          ))}
        </View>
      ))}
    </Section>
  );
}

export default function SavedSessions() {
  const { data, isLoading, isError, refetch } = useSavedSessions();
  const unsave = useSavedSessionsRemove();
  const groups = useMemo(() => byEvent(data ?? []), [data]);
  const count = data?.length ?? 0;

  return (
    <SubScreen
      title="Saved Sessions"
      subtitle={data ? `${count} Scheduled Event${count === 1 ? '' : 's'}` : 'Your planned sessions'}
    >
      {isLoading ? (
        <Section>
          <LoadingLine label="Loading your sessions…" />
        </Section>
      ) : isError ? (
        <Section>
          <StatePanel
            icon="cloud-offline-outline"
            title="We couldn’t load your sessions"
            body="Check your connection and try again."
          >
            <CtaButton label="Try Again" icon="refresh-outline" onPress={refetch} />
          </StatePanel>
        </Section>
      ) : count === 0 ? (
        <Section>
          <StatePanel
            size="large"
            icon="bookmark-outline"
            title="No saved sessions yet"
            body="Tap the bookmark on any session in the agenda and it will appear here, ready for the day."
          >
            <CtaButton label="Browse the Agenda" icon="calendar-outline" onPress={() => router.navigate('/events')} />
          </StatePanel>
        </Section>
      ) : (
        groups.map((g) => <EventSessions key={g.eventId} group={g} onUnsave={unsave} />)
      )}

      <Section>
        <NeedHelp />
      </Section>
    </SubScreen>
  );
}
