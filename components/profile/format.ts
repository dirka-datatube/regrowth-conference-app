/**
 * Date and time formatting for the Profile screens, in the device's time zone.
 *
 * Written out by hand rather than through Intl: the agenda style ("09:00 AM",
 * "MARCH 15, 2027") has to read the same on every browser and on Hermes, whose
 * Intl support varies by platform.
 */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** "09:00 AM" — the agenda card's clock. */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return `${pad(h % 12 || 12)}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

/** A calendar day, for grouping: "2027-03-15". */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "MARCH 15, 2027" — the agenda's day header. */
export function dayHeading(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`.toUpperCase();
}

/** "15–17 March 2027", "30 May – 2 June 2027", or one day: "15 March 2027". */
export function dayRange(firstIso: string, lastIso: string): string {
  const a = new Date(firstIso);
  const b = new Date(lastIso);
  const sameYear = a.getFullYear() === b.getFullYear();
  const sameMonth = sameYear && a.getMonth() === b.getMonth();
  if (sameMonth && a.getDate() === b.getDate()) {
    return `${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  }
  if (sameMonth) return `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  const left = `${a.getDate()} ${MONTHS[a.getMonth()]}${sameYear ? '' : ` ${a.getFullYear()}`}`;
  return `${left} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

/** "Just now", "12 min ago", "Today, 9:42 AM", "15 Mar, 9:42 AM". */
export function syncedAgo(at: number, now = Date.now()): string {
  const minutes = Math.floor((now - at) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const d = new Date(at);
  const time = clockTime(d.toISOString()).replace(/^0/, '');
  if (dayKey(d.toISOString()) === dayKey(new Date(now).toISOString())) return `Today, ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}, ${time}`;
}
