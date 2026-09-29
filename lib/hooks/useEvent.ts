import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { IS_DEMO } from '@/lib/demo';
import { demoEventRow } from '@/lib/demo-event';
import { EVENT_COLUMNS, toEventInfo, type EventInfo, type EventRow } from '@/lib/eventContent';

/**
 * What the guide's hooks hand a screen. React Query's own result types need
 * TypeScript 5.4 (`NoInfer`) and read as `any` under this repo's 5.3, so each
 * hook states its shape.
 */
export type GuideQuery<T> = {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
};

/**
 * One event, as the guide screens see it: the `events` row merged with the
 * product catalogue (lib/events.ts) and its parsed `settings` content.
 *
 * `event` is never null. Before the row loads — or when RLS hides it, which it
 * does for an event the account is not registered for until Sprint 08 — the
 * guide still has the product's name to show, and the screens that need the
 * row show their empty states.
 */
export function useEvent(eventId: string | undefined): {
  event: EventInfo;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
} {
  const query = useQuery({
    queryKey: ['event', eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<EventRow | null> => {
      if (IS_DEMO) return demoEventRow(eventId!);
      const { data, error } = await supabase.from('events').select(EVENT_COLUMNS).eq('id', eventId!).maybeSingle();
      if (error) throw error;
      return (data as EventRow | null) ?? null;
    },
  });
  const row: EventRow | null | undefined = query.data;

  const event = useMemo(() => toEventInfo(eventId ?? '', row), [eventId, row]);
  return { event, isLoading: query.isLoading, refetch: query.refetch };
}

/**
 * The current time, ticking every `ms`, for countdowns, greetings and "live
 * now" — so a screen left open rolls over without a reload.
 */
export function useEventClock(ms = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return now;
}
