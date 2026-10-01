import { useMemo } from 'react';
import { buildFeed, type EventInfo } from '@/lib/eventContent';
import { useEventClock } from '@/lib/hooks/useEvent';
import { useSessions } from '@/lib/hooks/useSessions';

/** The event home's "What's Coming" cards, refreshed each minute. */
export function useEventFeed(event: EventInfo) {
  const { data: sessions } = useSessions(event.id);
  const now = useEventClock();
  return useMemo(() => buildFeed(event, sessions ?? [], now), [event, sessions, now]);
}
