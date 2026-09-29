import { View, Text } from 'react-native';
import type { EventInfo } from '@/lib/eventContent';
import { eventPhase, formatDateRange } from '@/lib/eventTime';

/**
 * Countdown strip on the event home (146:2679): "24 days until Navigate 2027"
 * with a COUNTDOWN pill, then the dates and venue. Counted in the event's
 * zone from the events row; once the event starts it reads "Happening now",
 * and after it ends, "Thanks for joining". Without dates (the row is not
 * readable yet) there is nothing honest to count, so the strip is left out.
 */
export function CountdownBanner({ event, now }: { event: EventInfo; now: number }) {
  if (!event.startDate || !event.endDate) return null;
  const phase = eventPhase(event.startDate, event.endDate, now, event.timeZone);

  let headline: string;
  let pill: string;
  if (phase.phase === 'before') {
    headline = `${phase.daysUntil} ${phase.daysUntil === 1 ? 'day' : 'days'} until ${event.short}`;
    pill = 'COUNTDOWN';
  } else if (phase.phase === 'during') {
    headline = 'Happening now';
    pill = `DAY ${phase.day} OF ${phase.of}`;
  } else {
    headline = `Thanks for joining ${event.short}`;
    pill = 'WRAPPED';
  }

  return (
    <View className="gap-y-2 border-y border-teal-line bg-teal-wash px-5 py-4">
      <View className="flex-row items-center justify-between gap-x-3">
        <Text className="flex-1 font-data text-[16px] font-bold leading-[23px] text-snow" numberOfLines={2}>
          {headline}
        </Text>
        <View className="rounded-pill bg-ocean px-2 py-1">
          <Text className="font-label text-[10px] font-bold tracking-[1px] text-snow">{pill}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-x-2">
        <Text className="font-data text-[12px] text-quiet">{formatDateRange(event.startDate, event.endDate)}</Text>
        {!!event.venue && (
          <>
            <View className="h-1 w-1 rounded-pill bg-quiet" />
            <Text className="flex-1 font-data text-[12px] text-quiet" numberOfLines={1}>
              {event.venue}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
