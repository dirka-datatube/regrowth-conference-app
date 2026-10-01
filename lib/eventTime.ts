/**
 * Dates and times for the event guide.
 *
 * Two kinds of value come out of the database. `events.start_date` and
 * `end_date` are calendar days ('2027-03-15'), not instants, so they are never
 * passed through `new Date()` — that would read them as UTC midnight and shift
 * them a day west of Greenwich. `sessions.start_at` / `end_at` are instants,
 * shown in the event's time zone (`settings.timezone`) when it is set, so an
 * attendee checking the agenda from another state sees the venue's clock.
 *
 * Formats follow the comps: "09:00 AM", "MARCH 15, 2027", "March 15–17, 2027".
 */

/** A calendar day, 'YYYY-MM-DD'. */
export type DayKey = string;

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Intl with a time zone, falling back to the device's zone if it is unknown. */
function format(date: Date, options: Intl.DateTimeFormatOptions, timeZone?: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
}

/** The calendar day an instant falls on, in the given zone. */
export function dayKeyOf(instant: string | number | Date, timeZone?: string): DayKey {
  const date = new Date(instant);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone,
    }).formatToParts(date);
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    const [y, m, d] = [part('year'), part('month'), part('day')];
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // Unknown zone: fall through to the device's.
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isDayKey(value: unknown): value is DayKey {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Noon UTC on that day — safe to format with timeZone 'UTC' anywhere. */
function dayDate(key: DayKey) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function addDays(key: DayKey, n: number): DayKey {
  return dayKeyOf(dayDate(key).getTime() + n * DAY_MS, 'UTC');
}

export function daysBetween(from: DayKey, to: DayKey) {
  return Math.round((dayDate(to).getTime() - dayDate(from).getTime()) / DAY_MS);
}

/** Every day from start to end inclusive (capped, in case of a bad row). */
export function daysOf(start: DayKey, end: DayKey): DayKey[] {
  const count = Math.min(Math.max(daysBetween(start, end) + 1, 1), 31);
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** "MARCH 15, 2027" — the agenda's day selector. */
export function formatDayHeading(key: DayKey) {
  return format(dayDate(key), { month: 'long', day: 'numeric', year: 'numeric' }, 'UTC').toUpperCase();
}

/** "Monday, March 15, 2027" */
export function formatDayLong(key: DayKey) {
  return format(dayDate(key), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }, 'UTC');
}

/** "Mon 15" — compact, for results grouped by day. */
export function formatDayShort(key: DayKey) {
  return format(dayDate(key), { weekday: 'short', month: 'short', day: 'numeric' }, 'UTC');
}

/** "March 15–17, 2027", "May 30 – June 2, 2027", "December 30, 2026 – January 2, 2027". */
export function formatDateRange(start: DayKey, end: DayKey) {
  const a = dayDate(start);
  const b = dayDate(end);
  const month = (d: Date) => format(d, { month: 'long' }, 'UTC');
  const day = (d: Date) => format(d, { day: 'numeric' }, 'UTC');
  const year = (d: Date) => format(d, { year: 'numeric' }, 'UTC');
  if (start === end) return `${month(a)} ${day(a)}, ${year(a)}`;
  if (year(a) !== year(b)) return `${month(a)} ${day(a)}, ${year(a)} – ${month(b)} ${day(b)}, ${year(b)}`;
  if (month(a) !== month(b)) return `${month(a)} ${day(a)} – ${month(b)} ${day(b)}, ${year(b)}`;
  return `${month(a)} ${day(a)}–${day(b)}, ${year(a)}`;
}

/** "09:00 AM" */
export function formatTime(iso: string, timeZone?: string) {
  return format(new Date(iso), { hour: '2-digit', minute: '2-digit', hour12: true }, timeZone);
}

/** "09:00 AM – 10:00 AM" */
export function formatTimeRange(startIso: string, endIso: string, timeZone?: string) {
  return `${formatTime(startIso, timeZone)} – ${formatTime(endIso, timeZone)}`;
}

/** Where today sits against the event's dates, in the event's zone. */
export type EventPhase =
  | { phase: 'before'; daysUntil: number }
  | { phase: 'during'; day: number; of: number }
  | { phase: 'after' };

export function eventPhase(start: DayKey, end: DayKey, now: number, timeZone?: string): EventPhase {
  const today = dayKeyOf(now, timeZone);
  if (today < start) return { phase: 'before', daysUntil: daysBetween(today, start) };
  if (today > end) return { phase: 'after' };
  return { phase: 'during', day: daysBetween(start, today) + 1, of: daysBetween(start, end) + 1 };
}

/** The header greeting, on the attendee's own clock. */
export function greeting(now: number) {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** "JUST NOW", "12 MIN AGO", "3H AGO", "YESTERDAY", "MAR 3" — the update cards. */
export function relativeLabel(iso: string, now: number) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (minutes < 2) return 'JUST NOW';
  if (minutes < 60) return `${minutes} MIN AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  if (hours < 48) return 'YESTERDAY';
  return format(new Date(iso), { month: 'short', day: 'numeric' }).toUpperCase();
}
