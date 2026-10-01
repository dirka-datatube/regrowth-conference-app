/**
 * App Settings' "Last synced" line, on the device's clock: "Just now",
 * "12 min ago", "Today, 9:42 AM", "15 Mar, 9:42 AM". Written out by hand, as
 * Intl's time formats vary by browser and by Hermes build.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function clock(d: Date): string {
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function syncedAgo(at: number, now = Date.now()): string {
  const minutes = Math.floor((now - at) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const d = new Date(at);
  if (sameDay(d, new Date(now))) return `Today, ${clock(d)}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${clock(d)}`;
}
