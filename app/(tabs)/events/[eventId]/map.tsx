import { useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { DirectoryRow, FloorPlan, LevelTabs } from '@/components/event/VenueMap';
import { GuideEmpty, GuideLoading } from '@/components/event/GuideState';
import { useEvent, useEventClock } from '@/lib/hooks/useEvent';
import { useSessions } from '@/lib/hooks/useSessions';
import { isLive, type MapArea } from '@/lib/eventContent';

/**
 * Venue Map — Navigate (92:290) and Study Tour (211:1341): level pills, the
 * floor plan, and the Quick Directory for that level. Tapping a directory row
 * or an area highlights it on the plan. An area tied to a room says what it
 * is hosting while a session there is live.
 *
 * The floor plan is drawn from `settings.map` (lib/eventContent.ts) — the
 * comp's plan image could not be exported.
 */
export default function VenueMapScreen() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { event, isLoading } = useEvent(eventId);
  const { data: sessions } = useSessions(eventId);
  const now = useEventClock();
  const [levelId, setLevelId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const map = event.map;
  const level = map?.levels.find((l) => l.id === levelId) ?? map?.levels[0];

  function status(area: MapArea) {
    const room = area.room?.toLowerCase();
    const live = room && sessions?.find((s) => s.room?.toLowerCase() === room && isLive(s, now));
    return live ? `Currently Hosting “${live.title}”` : (area.note ?? null);
  }

  function select(area: MapArea) {
    setSelectedId((current) => (current === area.id ? null : area.id));
  }

  if (!map || !level) {
    return (
      <SubScreen title="Venue Map" subtitle={event.venue ?? undefined}>
        <Section>
          {isLoading && !event.loaded ? (
            <GuideLoading label="Loading the venue map…" />
          ) : (
            <GuideEmpty
              icon="map-outline"
              title="Venue map coming soon"
              body={`The floor plan for ${event.short} will appear here closer to the event.`}
            />
          )}
        </Section>
      </SubScreen>
    );
  }

  const directory = level.areas.filter((a) => a.directory);
  const selected = level.areas.find((a) => a.id === selectedId);

  return (
    <SubScreen title="Venue Map" subtitle={map.title ?? event.venue ?? undefined}>
      {map.levels.length > 1 && (
        <Section>
          <LevelTabs
            levels={map.levels}
            value={level.id}
            onChange={(id) => {
              setLevelId(id);
              setSelectedId(null);
            }}
          />
        </Section>
      )}

      <Section className="gap-y-2">
        <FloorPlan level={level} selectedId={selectedId} onSelect={select} />
        <Text className="font-data text-[12px] text-quiet" accessibilityLiveRegion="polite">
          {selected
            ? [selected.name, selected.location].filter(Boolean).join(' — ')
            : 'Tap an area or a directory entry to find it on the plan.'}
        </Text>
      </Section>

      <Section className="gap-y-2.5">
        <Text accessibilityRole="header" className="font-data text-[16px] font-bold text-snow">
          Quick Directory
        </Text>
        {directory.length ? (
          directory.map((a, i) => (
            <DirectoryRow key={`${i}-${a.id}`} area={a} status={status(a)} selected={a.id === selectedId} onPress={() => select(a)} />
          ))
        ) : (
          <Text className="font-data text-[13px] text-quiet">Nothing is listed on {level.label} yet.</Text>
        )}
      </Section>
    </SubScreen>
  );
}
