import { z } from 'zod';
import { STUDY_TOUR, eventHref, productFor, type EventScreen } from '@/lib/events';
import { dayKeyOf, daysOf, formatTime, isDayKey, relativeLabel, type DayKey } from '@/lib/eventTime';
import type { Event, SessionType, Speaker } from '@/types/database';

/**
 * The event guide's content model — everything the event home, agenda,
 * speakers, map, hotel, packing and weather screens read, for any event.
 *
 * TABLES. `events` (name, dates, venue, coordinates), `sessions` with
 * `session_speakers` → `speakers`, and the attendee's own `schedule_picks` and
 * `speaker_followers`.
 *
 * INTERIM — `events.settings`. Content with no table yet lives in the event
 * row's `settings` jsonb until the admin panel grows editors for it. Every key
 * is optional:
 *
 *   city       "Perth" — the Weather heading; defaults to the last part of `venue`
 *   timezone   IANA zone the agenda is shown in, e.g. "Australia/Perth";
 *              defaults to the device's
 *   welcome    { body } — the Welcome screen's line about the event
 *   updates    What's Coming: [{ id, title, body, posted_at, time?, place?,
 *              screen? | session_id? | url? }]. An update appears once
 *              `posted_at` has passed, so posts can be scheduled.
 *   hotel      { name, address?, phone?, website?, check_in?, check_out?,
 *              booking_code?, booking_note?, amenities?: string[],
 *              notes?: string[], lat?, lng? }
 *   packing    [{ title, items: [label | { id?, label, note? }] }]
 *   map        { title?, levels: [{ id, label, areas: [{ id, name, kind,
 *              x, y, w, h, location?, note?, room?, directory? }] }] } —
 *              areas are boxes on the floor plan in percent of its width and
 *              height; `room` matches `sessions.room` so the directory can say
 *              what an area is hosting now.
 *
 * Each key is parsed on its own, and each entry in a list on its own: a
 * malformed update, packing item or map area is skipped, and a block missing
 * what it needs (a hotel without a name, a map without levels) reads as
 * absent, so the screen shows its empty state. A typo in the admin JSON costs
 * one item or one screen, never the whole guide.
 */

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

export type EventRow = Pick<
  Event,
  'id' | 'name' | 'start_date' | 'end_date' | 'venue' | 'venue_lat' | 'venue_lng' | 'settings'
>;

export const EVENT_COLUMNS = 'id, name, start_date, end_date, venue, venue_lat, venue_lng, settings';

export type GuideSpeaker = Pick<
  Speaker,
  'id' | 'name' | 'title' | 'company' | 'bio' | 'headshot_url' | 'linkedin_url' | 'display_order'
>;

export const SPEAKER_COLUMNS = 'id, name, title, company, bio, headshot_url, linkedin_url, display_order';

/** A session with its speakers flattened out of the join table. */
export type GuideSession = {
  id: string;
  title: string;
  abstract: string | null;
  start_at: string;
  end_at: string;
  room: string | null;
  type: SessionType;
  speakers: Pick<GuideSpeaker, 'id' | 'name' | 'title' | 'company' | 'headshot_url'>[];
};

export const SESSION_COLUMNS = `id, title, abstract, start_at, end_at, room, type,
  speakers:session_speakers(speaker:speakers(id, name, title, company, headshot_url))`;

/** The shape PostgREST returns for SESSION_COLUMNS. */
export type SessionQueryRow = Omit<GuideSession, 'speakers'> & {
  speakers: { speaker: GuideSession['speakers'][number] | null }[] | null;
};

export function toGuideSession(row: SessionQueryRow): GuideSession {
  return {
    ...row,
    speakers: (row.speakers ?? []).flatMap((s) => (s.speaker ? [s.speaker] : [])),
  };
}

/** The tag pill on an agenda card. */
export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  keynote: 'KEYNOTE',
  panel: 'PANEL',
  workshop: 'WORKSHOP',
  breakout: 'BREAKOUT',
  meal: 'MEAL',
  social: 'SOCIAL',
  admin: 'INFO',
};

/** "Founder & Director | REGROWTH", as the speaker cards print it. */
export function speakerLine(s: { title: string | null; company: string | null }) {
  return [s.title, s.company].filter(Boolean).join(' | ');
}

export function firstName(name: string | null | undefined) {
  return (name ?? '').replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '').split(/\s+/)[0] ?? '';
}

// ---------------------------------------------------------------------------
// events.settings
// ---------------------------------------------------------------------------

const SCREENS = ['welcome', 'agenda', 'speakers', 'map', 'hotel', 'pack', 'weather'] as const satisfies readonly EventScreen[];

/** An array that keeps the entries that parse and drops the rest. */
function listOf<S extends z.ZodTypeAny>(item: S) {
  return z
    .array(z.unknown())
    .catch([])
    .transform((entries) =>
      entries.flatMap((entry) => {
        const result = item.safeParse(entry);
        return result.success ? [result.data as z.output<S>] : [];
      }),
    );
}

const updateSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().default(''),
  posted_at: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'posted_at must be a date'),
  time: z.string().optional(),
  place: z.string().optional(),
  // A bad link drops the link, not the update.
  screen: z.enum(SCREENS).optional().catch(undefined),
  session_id: z.string().optional().catch(undefined),
  url: z.string().url().optional().catch(undefined),
});

const hotelSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  booking_code: z.string().optional(),
  booking_note: z.string().optional(),
  amenities: listOf(z.string()),
  notes: listOf(z.string()),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const packItemSchema = z.union([
  z.string(),
  z.object({ id: z.string().optional(), label: z.string(), note: z.string().optional() }),
]);

const packingSchema = listOf(z.object({ title: z.string(), items: listOf(packItemSchema) })).refine(
  (groups) => groups.some((g) => g.items.length > 0),
  'a packing list needs at least one item',
);

export const AREA_KINDS = [
  'stage',
  'room',
  'booth',
  'meeting',
  'coffee',
  'food',
  'lounge',
  'entry',
  'info',
  'amenity',
] as const;

const percent = z.number().min(0).max(100);

const areaSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(AREA_KINDS).catch('room'),
  x: percent,
  y: percent,
  w: percent,
  h: percent,
  location: z.string().optional(),
  note: z.string().optional(),
  room: z.string().optional(),
  directory: z.boolean().default(true),
});

const mapSchema = z.object({
  title: z.string().optional(),
  levels: listOf(z.object({ id: z.string(), label: z.string(), areas: listOf(areaSchema) })).refine(
    (levels) => levels.length > 0,
    'a map needs at least one level',
  ),
});

const welcomeSchema = z.object({ body: z.string() });

export type EventUpdate = z.output<typeof updateSchema>;
export type HotelInfo = z.output<typeof hotelSchema>;
export type MapArea = z.output<typeof areaSchema>;
export type AreaKind = MapArea['kind'];
export type VenueMap = z.output<typeof mapSchema>;
export type PackItem = { id: string; label: string; note?: string };
export type PackGroup = { title: string; items: PackItem[] };

function parse<S extends z.ZodTypeAny>(schema: S, value: unknown): z.output<S> | null {
  if (value === undefined || value === null) return null;
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Ids key the ticks on the device, so they must be unique across the list. */
function toPackGroups(groups: z.output<typeof packingSchema>): PackGroup[] {
  const seen = new Set<string>();
  const unique = (id: string) => {
    let candidate = id;
    for (let n = 2; seen.has(candidate); n++) candidate = `${id}-${n}`;
    seen.add(candidate);
    return candidate;
  };
  return groups
    .filter((g) => g.items.length > 0)
    .map((g) => ({
      title: g.title,
      items: g.items.map((item) =>
        typeof item === 'string'
          ? { id: unique(slug(`${g.title}-${item}`)), label: item }
          : { id: unique(item.id ?? slug(`${g.title}-${item.label}`)), label: item.label, note: item.note },
      ),
    }));
}

/**
 * A general checklist for an event that has not published its own. It is
 * advice, not event facts, so it is safe to show before content lands.
 */
export const DEFAULT_PACKING: PackGroup[] = toPackGroups([
  { title: 'Essentials', items: ['Phone & charger', 'Wallet & cards', 'Any medication you need'] },
  { title: 'Documents', items: ['Photo ID', 'Your entry QR code (in this app)', 'Travel & accommodation confirmations'] },
  { title: 'Clothing', items: ['Comfortable shoes', 'A layer for air-conditioned rooms'] },
  { title: 'Tech', items: ['Portable power bank', 'Laptop or tablet'] },
  { title: 'Event extras', items: ['Business cards', 'Notebook & pen'] },
]);

// ---------------------------------------------------------------------------
// The event, as the guide sees it
// ---------------------------------------------------------------------------

export type EventInfo = {
  id: string;
  /** "Navigate 2027" — headings, buttons. */
  short: string;
  /** "NAVIGATE 2027" — the event home's greeting line. */
  title: string;
  subtitle: string | null;
  startDate: DayKey | null;
  endDate: DayKey | null;
  venue: string | null;
  /** The Weather heading. */
  city: string | null;
  lat: number | null;
  lng: number | null;
  timeZone: string | undefined;
  welcome: z.output<typeof welcomeSchema> | null;
  updates: EventUpdate[];
  hotel: HotelInfo | null;
  /** Null when the event has not published its own list. */
  packing: PackGroup[] | null;
  map: VenueMap | null;
  /**
   * False until the events row has loaded. It stays false for an event the
   * account cannot read — events RLS only opens to its own attendees until
   * Sprint 08 — and the guide then shows what the product catalogue knows.
   */
  loaded: boolean;
};

function validTimeZone(zone: unknown): string | undefined {
  if (typeof zone !== 'string' || !zone) return undefined;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone;
  } catch {
    return undefined;
  }
}

export function toEventInfo(eventId: string, row: EventRow | null | undefined): EventInfo {
  const product = productFor(eventId);
  const settings = (row?.settings ?? {}) as Record<string, unknown>;
  const name = row?.name ?? product?.short ?? 'Event';
  const city = typeof settings.city === 'string' && settings.city ? settings.city : null;
  const packing = parse(packingSchema, settings.packing);
  const venueCity = row?.venue?.split(',').pop()?.trim() || null;

  return {
    id: eventId,
    short: product?.short ?? name,
    title: product?.title ?? name.toUpperCase(),
    subtitle: product?.subtitle ?? null,
    startDate: isDayKey(row?.start_date) ? row.start_date : null,
    endDate: isDayKey(row?.end_date) ? row.end_date : null,
    venue: row?.venue ?? null,
    city: city ?? venueCity,
    lat: row?.venue_lat ?? null,
    lng: row?.venue_lng ?? null,
    timeZone: validTimeZone(settings.timezone),
    welcome: parse(welcomeSchema, settings.welcome),
    updates: parse(listOf(updateSchema), settings.updates) ?? [],
    hotel: parse(hotelSchema, settings.hotel),
    packing: packing ? toPackGroups(packing) : null,
    map: parse(mapSchema, settings.map),
    loaded: !!row,
  };
}

/** The event home search field; the Study Tour visits offices, not exhibitors. */
export function searchHint(eventId: string) {
  return eventId === STUDY_TOUR.id
    ? 'Search sessions, speakers, offices…'
    : 'Search sessions, speakers, exhibitors…';
}

// ---------------------------------------------------------------------------
// Links inside the guide
// ---------------------------------------------------------------------------

export function sessionHref(eventId: string, sessionId: string) {
  return `${eventHref(eventId)}/session/${encodeURIComponent(sessionId)}`;
}

export function speakerHref(eventId: string, speakerId: string) {
  return `${eventHref(eventId)}/speaker/${encodeURIComponent(speakerId)}`;
}

export function agendaHref(eventId: string, query?: string) {
  const q = query?.trim();
  return q ? `${eventHref(eventId, 'agenda')}?q=${encodeURIComponent(q)}` : eventHref(eventId, 'agenda');
}

/** Where an update's "View Details" goes: a guide route or an external URL. */
export type GuideLink = { href: string } | { url: string };

export function updateLink(eventId: string, u: Pick<EventUpdate, 'screen' | 'session_id' | 'url'>): GuideLink | null {
  if (u.session_id) return { href: sessionHref(eventId, u.session_id) };
  if (u.screen) return { href: eventHref(eventId, u.screen) };
  if (u.url) return { url: u.url };
  return null;
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

/** The event's days, plus any day a session falls on outside them. */
export function agendaDays(event: EventInfo, sessions: GuideSession[]): DayKey[] {
  const days = new Set<DayKey>(event.startDate && event.endDate ? daysOf(event.startDate, event.endDate) : []);
  for (const s of sessions) days.add(dayKeyOf(s.start_at, event.timeZone));
  return Array.from(days).sort();
}

/** Today while the event is on; otherwise its first day. */
export function defaultAgendaDay(days: DayKey[], now: number, timeZone?: string): DayKey | undefined {
  const today = dayKeyOf(now, timeZone);
  return days.includes(today) ? today : days[0];
}

/** Every word of the query appears in the session's title, room, type or speakers. */
export function matchesSession(s: GuideSession, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = [
    s.title,
    s.abstract,
    s.room,
    SESSION_TYPE_LABEL[s.type],
    ...s.speakers.flatMap((sp) => [sp.name, sp.title, sp.company]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}

export function groupByDay(sessions: GuideSession[], timeZone?: string) {
  const groups = new Map<DayKey, GuideSession[]>();
  for (const s of sessions) {
    const day = dayKeyOf(s.start_at, timeZone);
    groups.set(day, [...(groups.get(day) ?? []), s]);
  }
  return Array.from(groups, ([day, items]) => ({ day, sessions: items })).sort((a, b) => a.day.localeCompare(b.day));
}

// ---------------------------------------------------------------------------
// What's Coming
// ---------------------------------------------------------------------------

export function isLive(s: Pick<GuideSession, 'start_at' | 'end_at'>, now: number) {
  return Date.parse(s.start_at) <= now && now < Date.parse(s.end_at);
}

/** One card in the event home's "What's Coming" feed (146:2575). */
export type FeedItem = {
  key: string;
  title: string;
  /** "LIVE NOW", "IN 20 MIN", "JUST NOW", "3H AGO". */
  when: string;
  body: string;
  /** "6:00 PM • Grand Ballroom" */
  meta: string | null;
  live: boolean;
  link: GuideLink | null;
};

/**
 * The feed: sessions running now, then sessions starting within half an hour
 * (August's "happening now" and "up next" panels, where the comp puts them),
 * then the team's posted updates, newest first.
 */
export function buildFeed(event: EventInfo, sessions: GuideSession[], now: number, limit = 3): FeedItem[] {
  const soon = 30 * 60000;
  const place = (s: GuideSession) => [formatTime(s.start_at, event.timeZone), s.room].filter(Boolean).join(' • ');

  const fromSessions: FeedItem[] = sessions.flatMap((s) => {
    const starts = Date.parse(s.start_at);
    const live = isLive(s, now);
    if (!live && !(starts > now && starts - now <= soon)) return [];
    return [
      {
        key: `session-${s.id}`,
        title: s.title,
        when: live ? 'LIVE NOW' : `IN ${Math.max(1, Math.round((starts - now) / 60000))} MIN`,
        body: s.abstract ?? '',
        meta: place(s),
        live,
        link: { href: sessionHref(event.id, s.id) },
      },
    ];
  });

  const fromUpdates: FeedItem[] = event.updates
    .filter((u) => Date.parse(u.posted_at) <= now)
    .sort((a, b) => Date.parse(b.posted_at) - Date.parse(a.posted_at))
    .map((u, i) => ({
      key: `update-${i}-${u.id}`,
      title: u.title,
      when: relativeLabel(u.posted_at, now),
      body: u.body,
      meta: [u.time, u.place].filter(Boolean).join(' • ') || null,
      live: false,
      link: updateLink(event.id, u),
    }));

  return [...fromSessions, ...fromUpdates].slice(0, limit);
}
