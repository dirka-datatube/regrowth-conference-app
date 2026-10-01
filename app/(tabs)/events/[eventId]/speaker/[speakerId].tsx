import { useMemo } from 'react';
import { View, Text, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { MenuRow } from '@/components/MenuRow';
import { Avatar } from '@/components/Avatar';
import { EventBell } from '@/components/event/EventBell';
import { SessionCard } from '@/components/event/SessionCard';
import { ActionButton } from '@/components/event/ActionButton';
import { RegisterPrompt } from '@/components/event/RegisterPrompt';
import { GuideEmpty, GuideLoading } from '@/components/event/GuideState';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { useEvent, useEventClock } from '@/lib/hooks/useEvent';
import { useSchedulePicks, useSessions } from '@/lib/hooks/useSessions';
import { useSpeaker, useSpeakerFollows } from '@/lib/hooks/useSpeakers';
import { eventHref } from '@/lib/events';
import { firstName, isLive, sessionHref, speakerLine } from '@/lib/eventContent';

/**
 * Speaker profile — "Speakers ABOUT" (239:1501), whose Speaker component
 * (239:1600) is a 262px card: photo, name, role. Built from those and v2
 * patterns; re-check against 239:1501 when Figma reads are available.
 *
 * Then the bio, their sessions at this event (saveable, as on the agenda),
 * and a question for them. Follow writes `speaker_followers`.
 */
export default function SpeakerProfile() {
  const { eventId = '', speakerId = '' } = useLocalSearchParams<{ eventId: string; speakerId: string }>();
  const { event } = useEvent(eventId);
  const { speaker, isLoading } = useSpeaker(eventId, speakerId);
  const { data: sessions } = useSessions(eventId);
  const follows = useSpeakerFollows();
  const picks = useSchedulePicks();
  const { isRegisteredFor } = useRegistrations();
  const now = useEventClock();
  const registered = isRegisteredFor(eventId);

  const theirs = useMemo(
    () => (sessions ?? []).filter((s) => s.speakers.some((sp) => sp.id === speakerId)),
    [sessions, speakerId],
  );

  if (!speaker) {
    return (
      <SubScreen title="Speakers" subtitle="Keynote & Industry’s Best" right={<EventBell />}>
        <Section>
          {isLoading ? (
            <GuideLoading label="Loading the speaker…" />
          ) : (
            <GuideEmpty icon="mic-outline" title="Speaker not found" body={`They are not on the ${event.short} line-up.`}>
              <ActionButton
                label="See all speakers"
                onPress={() => router.replace(eventHref(eventId, 'speakers') as never)}
              />
            </GuideEmpty>
          )}
        </Section>
      </SubScreen>
    );
  }

  const first = firstName(speaker.name) || speaker.name;
  const following = follows.isFollowing(speaker.id);
  const line = speakerLine(speaker);
  const linkedin = speaker.linkedin_url;
  const canSave = registered && picks.canSave;

  return (
    <SubScreen title="Speakers" subtitle="Keynote & Industry’s Best" right={<EventBell />}>
      <Section>
        <View className="items-center gap-y-4 rounded-card border border-card-line bg-well px-5 pb-5 pt-6">
          <Avatar name={speaker.name} uri={speaker.headshot_url} size={120} />
          <View className="items-center gap-y-1">
            <Text accessibilityRole="header" className="text-center font-data text-[22px] font-bold text-snow">
              {speaker.name}
            </Text>
            {!!line && <Text className="text-center font-data text-[13px] text-snow/80">{line}</Text>}
          </View>
          {((registered && follows.canFollow) || !!linkedin) && (
            <View className="flex-row flex-wrap justify-center gap-3">
              {registered && follows.canFollow && (
                <ActionButton
                  label={following ? 'Following' : 'Follow'}
                  icon={following ? 'checkmark' : 'person-add-outline'}
                  tone={following ? 'outline' : 'ocean'}
                  selected={following}
                  accessibilityLabel={following ? `Following ${speaker.name}. Unfollow` : `Follow ${speaker.name}`}
                  onPress={() => follows.toggle(speaker.id)}
                  className="min-w-[128px]"
                />
              )}
              {!!linkedin && (
                <ActionButton
                  label="LinkedIn"
                  icon="logo-linkedin"
                  tone="outline"
                  accessibilityLabel={`${speaker.name} on LinkedIn`}
                  onPress={() => Linking.openURL(linkedin).catch(() => {})}
                  className="min-w-[128px]"
                />
              )}
            </View>
          )}
        </View>
      </Section>

      {!!speaker.bio && (
        <Section className="gap-y-3">
          <SectionHeading title={`About ${first}`} />
          <Text className="font-body text-[14px] leading-[21px] text-lede">{speaker.bio}</Text>
        </Section>
      )}

      {theirs.length > 0 && (
        <Section className="gap-y-3">
          <SectionHeading title={theirs.length === 1 ? 'Session' : 'Sessions'} subtitle={`${first} at ${event.short}`} />
          {theirs.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              timeZone={event.timeZone}
              live={isLive(s, now)}
              saved={picks.isSaved(s.id)}
              onToggleSave={canSave ? () => picks.toggle(s.id) : undefined}
              onPress={() => router.push(sessionHref(eventId, s.id) as never)}
            />
          ))}
        </Section>
      )}

      <Section>
        {registered ? (
          <MenuRow
            icon="help-circle-outline"
            title={`Ask ${first} a question`}
            subtitle="It goes to the Q&A for their sessions"
            onPress={() => router.push(`/questions?speaker_id=${encodeURIComponent(speaker.id)}` as never)}
          />
        ) : (
          <RegisterPrompt eventName={event.short} unlocks={`follow ${first} and send them questions`} />
        )}
      </Section>
    </SubScreen>
  );
}
