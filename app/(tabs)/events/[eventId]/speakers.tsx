import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SearchField } from '@/components/SearchField';
import { EventBell } from '@/components/event/EventBell';
import { PersonCard } from '@/components/event/PersonCard';
import { GuideEmpty, GuideLoading } from '@/components/event/GuideState';
import { useEvent } from '@/lib/hooks/useEvent';
import { useSpeakers } from '@/lib/hooks/useSpeakers';
import { firstName, speakerHref, speakerLine } from '@/lib/eventContent';

/**
 * Speakers — Navigate Speakers (239:1333). The event's line-up in running
 * order as profile cards; "About {first name}" opens the profile.
 */
export default function Speakers() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { event } = useEvent(eventId);
  const { data: speakers, isLoading } = useSpeakers(eventId);
  const [q, setQ] = useState('');

  const all = useMemo(() => speakers ?? [], [speakers]);
  const query = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      query
        ? all.filter((s) => [s.name, s.title, s.company].filter(Boolean).join(' ').toLowerCase().includes(query))
        : all,
    [all, query],
  );

  let body;
  if (isLoading && !speakers) {
    body = <GuideLoading label="Loading speakers…" />;
  } else if (!all.length) {
    body = (
      <GuideEmpty
        icon="mic-outline"
        title="Speakers coming soon"
        body={`The ${event.short} line-up will appear here as speakers are announced.`}
      />
    );
  } else if (!list.length) {
    body = <GuideEmpty icon="search" title="No speakers found" body={`Nobody on the line-up matches “${q.trim()}”.`} />;
  } else {
    body = list.map((s) => (
      <PersonCard
        key={s.id}
        name={s.name}
        line={speakerLine(s)}
        photoUrl={s.headshot_url}
        initials
        chip={{ label: `About ${firstName(s.name)}` }}
        onPress={() => router.push(speakerHref(eventId, s.id) as never)}
        accessibilityLabel={`About ${s.name}`}
      />
    ));
  }

  return (
    <SubScreen title="Speakers" subtitle="Keynote & Industry’s Best" right={<EventBell />}>
      <Section>
        <SearchField value={q} onChangeText={setQ} placeholder="Search speaker…" voiceAvailable={false} />
      </Section>
      <Section className="gap-y-2.5">{body}</Section>
    </SubScreen>
  );
}
