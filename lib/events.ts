import { env } from '@/lib/env';

/**
 * The two REGROWTH products the app sells into.
 *
 * IDs match the rows the migrations seed (Navigate: the initial seed;
 * Study Tour: 20260819000000). The `events` table stays the source of truth
 * for dates and venue. The marketing copy the v2 comps put on the hero and the
 * badge lives here until Sprint 10 adds an event content model — and, unlike
 * `events`, it is readable before the attendee is registered for that event
 * (events RLS only opens up in Sprint 08).
 */

export type Product = {
  id: string;
  /** Hero title, set in capitals on the comps. */
  title: string;
  /** Hero sub-line, e.g. "REGROWTH Annual Conference". */
  subtitle: string;
  /** Short name for chips, badges and buttons, e.g. "Navigate 2027". */
  short: string;
  /** How to use the badge, from My Tickets (146:1906). */
  entry: string;
};

export const NAVIGATE: Product = {
  id: env.eventId || '00000000-0000-0000-0000-000000000001',
  title: 'NAVIGATE 2027',
  subtitle: 'REGROWTH Annual Conference',
  short: 'Navigate 2027',
  // The comp adds "at Crown"; the venue is Decision 2, so it is left out.
  entry: 'Present this QR code at the registration desk to gain entry.',
};

export const STUDY_TOUR: Product = {
  id: '00000000-0000-0000-0000-000000000002',
  title: 'STUDY TOUR 2027',
  subtitle: 'A bespoke world-class client experience',
  short: 'Study Tour 2027',
  entry: 'Present this QR code at registration to verify your attendance.',
};

export const PRODUCTS: Product[] = [NAVIGATE, STUDY_TOUR];

export function productFor(eventId: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === eventId);
}

/** The screens of an event's guide, under the Events tab. */
export type EventScreen = 'welcome' | 'agenda' | 'speakers' | 'map' | 'hotel' | 'pack' | 'weather';

/** An event's guide: its home (146:2498 / 211:872), or one of its screens. */
export function eventHref(eventId: string, screen?: EventScreen) {
  return screen ? `/events/${eventId}/${screen}` : `/events/${eventId}`;
}

/**
 * Where the hero's call to action goes. ACCESS EVENT opens the event's home;
 * GET STARTED opens its welcome screen (34:1421), which introduces the event
 * to someone not yet registered.
 */
export function eventEntryHref(eventId: string, registered = true) {
  return eventHref(eventId, registered ? undefined : 'welcome');
}
