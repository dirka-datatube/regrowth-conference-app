import type { Attendee, RegistrationStatus } from '@/types/database';

/**
 * The registration read model (Sprint 07).
 *
 * The v2 design hangs off one rule: an account sees an event as *registered*
 * or *not*. Every screen asks that question through this shape, never through
 * `attendees` directly, so Sprint 08 can replace the data underneath — a real
 * `registrations` table, several per account — without touching a screen.
 */
export type Registration = {
  eventId: string;
  /** "VIP Pass", "VIP Delegate"… Null when the tier was never recorded. */
  ticketTier: string | null;
  status: RegistrationStatus;
  /** Printed on the badge as `<APP_URL>/c/<qrToken>` — see lib/qr.ts. */
  qrToken: string;
};

/**
 * Today an attendee row is exactly one registration, for its event_id
 * (migration 20260925000000).
 */
export function registrationsFromAttendee(attendee: Attendee | null): Registration[] {
  if (!attendee) return [];
  return [
    {
      eventId: attendee.event_id,
      ticketTier: attendee.ticket_tier ?? null,
      // A row read before that migration is applied has no status. Every such
      // row came from a paid registration, which is also the column default.
      status: attendee.registration_status ?? 'confirmed',
      qrToken: attendee.qr_token,
    },
  ];
}

/** Only a confirmed registration unlocks an event. */
export function isConfirmedFor(registrations: Registration[], eventId: string) {
  return registrations.some((r) => r.eventId === eventId && r.status === 'confirmed');
}
