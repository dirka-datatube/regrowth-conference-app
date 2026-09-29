import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { NeedHelp } from '@/components/NeedHelp';
import { CheckRow } from '@/components/event/CheckRow';
import { GuideLoading } from '@/components/event/GuideState';
import { useEvent } from '@/lib/hooks/useEvent';
import { useEventChecklist } from '@/lib/hooks/useEventChecklist';
import { DEFAULT_PACKING } from '@/lib/eventContent';

/**
 * What to Pack — Navigate (92:292) and Study Tour (211:1056). Both frames are
 * 1673 tall with no layer data yet, so this is built as the long grouped
 * checklist their height implies, in v2 patterns; re-check against 92:292 when
 * Figma reads are available.
 *
 * The list is `settings.packing` (lib/eventContent.ts), or a general one until
 * the event publishes its own. Ticks stay on this device, per event.
 */
export default function WhatToPack() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { event, isLoading } = useEvent(eventId);
  const { checked, ready, toggle, clear } = useEventChecklist(eventId);

  if (isLoading && !event.loaded) {
    return (
      <SubScreen title="What to Pack" subtitle="Everything you need to prepare">
        <Section>
          <GuideLoading label="Loading your checklist…" />
        </Section>
      </SubScreen>
    );
  }

  const groups = event.packing ?? DEFAULT_PACKING;
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const packed = groups.reduce((n, g) => n + g.items.filter((i) => checked.includes(i.id)).length, 0);
  const share = total ? packed / total : 0;

  return (
    <SubScreen title="What to Pack" subtitle="Everything you need to prepare">
      <Section>
        <View className="gap-y-3 rounded-card border border-hairline bg-tile p-4">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-data text-[16px] font-bold text-snow" accessibilityLiveRegion="polite">
              {ready ? `${packed} of ${total} packed` : `${total} things to pack`}
            </Text>
            {ready && <Text className="font-data text-[13px] text-quiet">{Math.round(share * 100)}%</Text>}
          </View>
          <View
            className="h-2 overflow-hidden rounded-pill bg-well"
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: total, now: packed }}
          >
            <View className="h-2 rounded-pill bg-accent" style={{ width: `${share * 100}%` }} />
          </View>
          <Text className="font-data text-[12px] leading-[17px] text-quiet">
            {event.packing
              ? `Packed for ${event.short}. Your ticks stay on this phone.`
              : `A general checklist — the ${event.short} list will appear here once it’s published. Your ticks stay on this phone.`}
          </Text>
        </View>
      </Section>

      {groups.map((g, index) => {
        const done = g.items.filter((i) => checked.includes(i.id)).length;
        return (
          <Section key={`${index}-${g.title}`} className="gap-y-2.5">
            <View className="flex-row items-end justify-between">
              <SectionHeading title={g.title} />
              <Text className="font-data text-[12px] text-quiet">
                {done}/{g.items.length}
              </Text>
            </View>
            {g.items.map((item) => (
              <CheckRow
                key={item.id}
                label={item.label}
                note={item.note}
                checked={checked.includes(item.id)}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </Section>
        );
      })}

      {packed > 0 && (
        <Section className="items-center">
          <Pressable onPress={clear} accessibilityRole="button" hitSlop={10} className="px-4 py-2">
            <Text className="font-data text-[13px] text-quiet">Clear all ticks</Text>
          </Pressable>
        </Section>
      )}

      <Section>
        <NeedHelp />
      </Section>
    </SubScreen>
  );
}
