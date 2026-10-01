import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { MenuRow } from '@/components/MenuRow';
import { EventBell } from '@/components/event/EventBell';
import { TypeTag } from '@/components/event/SessionCard';
import { PersonCard } from '@/components/event/PersonCard';
import { ActionButton } from '@/components/event/ActionButton';
import { RegisterPrompt } from '@/components/event/RegisterPrompt';
import { GuideEmpty, GuideLoading } from '@/components/event/GuideState';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { useEvent, useEventClock } from '@/lib/hooks/useEvent';
import { useSchedulePicks, useSession } from '@/lib/hooks/useSessions';
import { eventHref } from '@/lib/events';
import { firstName, isLive, speakerHref, speakerLine } from '@/lib/eventContent';
import { dayKeyOf, formatDayLong, formatTimeRange } from '@/lib/eventTime';

/**
 * Session detail — "Agenda SPECIFIC" (239:1166). Built from the agenda card,
 * the Btn 2 component ("Save session", 239:1290) and v2 patterns; re-check
 * against 239:1166 when Figma reads are available.
 *
 * When and where, what it is about, who is speaking, then Save session and
 * the in-session tools: notes and Q&A, both tied to this session.
 */
export default function SessionDetail() {
  const { eventId = '', sessionId = '' } = useLocalSearchParams<{ eventId: string; sessionId: string }>();
  const { event } = useEvent(eventId);
  const { session, isLoading } = useSession(eventId, sessionId);
  const { isRegisteredFor } = useRegistrations();
  const picks = useSchedulePicks();
  const now = useEventClock();
  const registered = isRegisteredFor(eventId);

  if (!session) {
    return (
      <SubScreen title="Agenda" subtitle={`${event.short} Programme`} right={<EventBell />}>
        <Section>
          {isLoading ? (
            <GuideLoading label="Loading the session…" />
          ) : (
            <GuideEmpty icon="calendar-outline" title="Session not found" body="It may have moved or been taken off the programme.">
              <ActionButton
                label="View the agenda"
                onPress={() => router.replace(eventHref(eventId, 'agenda') as never)}
              />
            </GuideEmpty>
          )}
        </Section>
      </SubScreen>
    );
  }

  const saved = picks.isSaved(session.id);
  const live = isLive(session, now);
  const when = formatTimeRange(session.start_at, session.end_at, event.timeZone);
  const param = encodeURIComponent(session.id);

  return (
    <SubScreen title="Agenda" subtitle={`${event.short} Programme`} right={<EventBell />}>
      <Section>
        <View className="gap-y-3 rounded-card border border-hairline bg-tile p-[18px]">
          <View className="flex-row items-center justify-between gap-x-3">
            <View className="flex-1 flex-row items-center gap-x-2">
              {live && <View className="h-2 w-2 rounded-pill bg-switch-on" />}
              <Text className="flex-1 font-data text-[12px] font-semibold tracking-[0.5px] text-quiet">
                {[live ? 'LIVE NOW' : null, when, session.room?.toUpperCase()].filter(Boolean).join(' • ')}
              </Text>
            </View>
            <TypeTag type={session.type} />
          </View>
          <Text accessibilityRole="header" className="font-data text-[22px] font-semibold leading-[28px] text-snow">
            {session.title}
          </Text>
          <Text className="font-body text-[13px] text-quiet">
            {formatDayLong(dayKeyOf(session.start_at, event.timeZone))}
          </Text>
        </View>
      </Section>

      <Section>
        {registered ? (
          <ActionButton
            label={saved ? 'Saved to your schedule' : 'Save session'}
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            tone={saved ? 'outline' : 'ocean'}
            selected={saved}
            accessibilityLabel={saved ? 'Saved to your schedule. Remove from saved sessions' : 'Save session'}
            onPress={picks.canSave ? () => picks.toggle(session.id) : undefined}
          />
        ) : (
          <RegisterPrompt eventName={event.short} unlocks="save sessions, take notes and ask the speakers questions" />
        )}
      </Section>

      {!!session.abstract && (
        <Section className="gap-y-3">
          <SectionHeading title="About this session" />
          <Text className="font-body text-[14px] leading-[21px] text-lede">{session.abstract}</Text>
        </Section>
      )}

      {session.speakers.length > 0 && (
        <Section className="gap-y-3">
          <SectionHeading title={session.speakers.length === 1 ? 'Speaker' : 'Speakers'} />
          {session.speakers.map((sp) => (
            <PersonCard
              key={sp.id}
              name={sp.name}
              line={speakerLine(sp)}
              photoUrl={sp.headshot_url}
              initials
              chip={{ label: `About ${firstName(sp.name)}` }}
              onPress={() => router.push(speakerHref(eventId, sp.id) as never)}
              accessibilityLabel={`About ${sp.name}`}
            />
          ))}
        </Section>
      )}

      {registered && (
        <Section className="gap-y-3">
          <SectionHeading title="In the session" />
          <MenuRow
            icon="create-outline"
            title="Take notes"
            subtitle="Capture key ideas as you listen"
            onPress={() => router.push(`/notes/new?session_id=${param}` as never)}
          />
          <MenuRow
            icon="help-circle-outline"
            title="Ask a question"
            subtitle="Send the speakers a question for Q&A"
            onPress={() => router.push(`/questions?session_id=${param}` as never)}
          />
        </Section>
      )}
    </SubScreen>
  );
}
