import { useEffect, useMemo, useState } from 'react';
import { View, Text, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SearchField } from '@/components/SearchField';
import { EventBell } from '@/components/event/EventBell';
import { DaySelector } from '@/components/event/DaySelector';
import { SessionCard } from '@/components/event/SessionCard';
import { GuideEmpty, GuideLoading } from '@/components/event/GuideState';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { useEvent, useEventClock } from '@/lib/hooks/useEvent';
import { useSchedulePicks, useSessions } from '@/lib/hooks/useSessions';
import {
  agendaDays,
  defaultAgendaDay,
  groupByDay,
  isLive,
  matchesSession,
  sessionHref,
  type GuideSession,
} from '@/lib/eventContent';
import { dayKeyOf, formatDayHeading, type DayKey } from '@/lib/eventTime';
import { colors } from '@/lib/theme';

/**
 * Agenda — Navigate (92:288) and Study Tour (211:1426).
 *
 * One day at a time behind the day selector, opening on today while the event
 * is on. Search (also reached from the event home with `?q=`) looks across
 * every day and groups what it finds by day. The bookmark saves a session to
 * the attendee's schedule — Profile → Saved Sessions — and only shows for an
 * event they are registered for.
 */
export default function Agenda() {
  const { eventId = '', q: initialQuery } = useLocalSearchParams<{ eventId: string; q?: string }>();
  const { event } = useEvent(eventId);
  const { data: sessions, isLoading, refetch } = useSessions(eventId);
  const { isRegisteredFor } = useRegistrations();
  const picks = useSchedulePicks();
  const now = useEventClock();
  const [q, setQ] = useState(initialQuery ?? '');
  const [day, setDay] = useState<DayKey | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // A search handed over from the event home replaces whatever was typed.
  useEffect(() => setQ(initialQuery ?? ''), [initialQuery]);

  const all = useMemo(() => sessions ?? [], [sessions]);
  const days = useMemo(() => agendaDays(event, all), [event, all]);
  const activeDay = day && days.includes(day) ? day : defaultAgendaDay(days, now, event.timeZone);
  const query = q.trim();

  const results = useMemo(
    () => (query ? groupByDay(all.filter((s) => matchesSession(s, query)), event.timeZone) : []),
    [all, query, event.timeZone],
  );
  const onDay = useMemo(
    () => all.filter((s) => dayKeyOf(s.start_at, event.timeZone) === activeDay),
    [all, activeDay, event.timeZone],
  );
  const matchCount = results.reduce((n, g) => n + g.sessions.length, 0);
  const canSave = isRegisteredFor(eventId) && picks.canSave;

  async function refresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  function card(s: GuideSession) {
    return (
      <SessionCard
        key={s.id}
        session={s}
        timeZone={event.timeZone}
        live={isLive(s, now)}
        saved={picks.isSaved(s.id)}
        onToggleSave={canSave ? () => picks.toggle(s.id) : undefined}
        onPress={() => router.push(sessionHref(eventId, s.id) as never)}
      />
    );
  }

  let body;
  if (isLoading && !sessions) {
    body = (
      <Section>
        <GuideLoading label="Loading the programme…" />
      </Section>
    );
  } else if (!all.length) {
    body = (
      <Section>
        <GuideEmpty
          icon="calendar-outline"
          title="Programme coming soon"
          body={`The ${event.short} programme will appear here as soon as it’s published.`}
        />
      </Section>
    );
  } else if (query) {
    body = (
      <Section className="gap-y-5">
        {matchCount ? (
          <Text className="font-data text-[13px] text-quiet" accessibilityLiveRegion="polite">
            {matchCount === 1 ? '1 session matches' : `${matchCount} sessions match`} “{query}”
          </Text>
        ) : (
          <GuideEmpty
            icon="search"
            title="No sessions found"
            body={`Nothing matches “${query}”. Try a speaker’s name, a room, or keynote, panel or workshop.`}
          />
        )}
        {results.map((g) => (
          <View key={g.day} className="gap-y-3">
            <Text className="font-label text-[12px] font-bold tracking-[1px] text-quiet">{formatDayHeading(g.day)}</Text>
            {g.sessions.map(card)}
          </View>
        ))}
      </Section>
    );
  } else {
    body = (
      <>
        {!!activeDay && (
          <Section>
            <DaySelector days={days} value={activeDay} onChange={setDay} />
          </Section>
        )}
        <Section className="gap-y-3">
          {onDay.length ? (
            onDay.map(card)
          ) : (
            <GuideEmpty icon="calendar-clear-outline" title="Nothing scheduled" body="There are no sessions on this day yet." />
          )}
        </Section>
      </>
    );
  }

  return (
    <SubScreen
      title="Agenda"
      subtitle={`${event.short} Programme`}
      right={<EventBell />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.earth} />}
    >
      <Section>
        <SearchField value={q} onChangeText={setQ} placeholder="Search sessions or speakers…" voiceAvailable={false} />
      </Section>
      {body}
    </SubScreen>
  );
}
