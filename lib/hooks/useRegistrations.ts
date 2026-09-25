import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, DEMO_REGISTERED, demoRegistrations } from '@/lib/demo';
import { isConfirmedFor, registrationsFromAttendee, type Registration } from '@/lib/registrations';
import { PRODUCTS } from '@/lib/events';

/**
 * The signed-in account's registrations, and the one question every v2 screen
 * asks: is this person registered for that event?
 *
 * Reads from the attendee already in the store (loaded by useAttendee in the
 * tabs layout), so it costs no extra request. In demo mode `?registered=0`
 * previews the not-registered state.
 */
export function useRegistrations() {
  const attendee = useAppStore((s) => s.attendee);

  const registrations = useMemo<Registration[]>(() => {
    if (IS_DEMO) return DEMO_REGISTERED ? demoRegistrations : [];
    return registrationsFromAttendee(attendee);
  }, [attendee]);

  // Confirmed registrations are tickets. Products come first in catalogue
  // order (Navigate, then the Study Tour), anything else after.
  const tickets = useMemo(() => {
    const rank = (r: Registration) => {
      const i = PRODUCTS.findIndex((p) => p.id === r.eventId);
      return i === -1 ? PRODUCTS.length : i;
    };
    return registrations.filter((r) => r.status === 'confirmed').sort((a, b) => rank(a) - rank(b));
  }, [registrations]);

  const isRegisteredFor = useCallback(
    (eventId: string) => isConfirmedFor(registrations, eventId),
    [registrations],
  );

  return { registrations, tickets, isRegisteredFor };
}
