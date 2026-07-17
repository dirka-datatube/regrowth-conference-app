// Pure push-eligibility logic — unit-tested in supabase/functions/tests.
// Rules (spec §3): per-category opt-outs; hard cap of 4 non-announcement
// notifications per attendee per day; admin announcements bypass both.

export type EligibleAttendee = {
  id: string;
  push_token: string | null;
  notification_prefs: Record<string, unknown> | null;
};

export const DAILY_CAP = 4;

export function eligibleRecipients(
  attendees: EligibleAttendee[],
  notificationType: string,
  deliveredTodayCounts: Map<string, number>,
): EligibleAttendee[] {
  const isAdminAnnouncement = notificationType === 'admin_announcement';
  return attendees.filter((a) => {
    if (!a.push_token) return false;
    if (isAdminAnnouncement) return true;
    const prefs = (a.notification_prefs ?? {}) as Record<string, unknown>;
    if (prefs[notificationType] === false) return false;
    return (deliveredTodayCounts.get(a.id) ?? 0) < DAILY_CAP;
  });
}

// Queue delivery order: highest urgency first when competing for cap slots.
export const PRIORITY: Record<string, number> = {
  admin_announcement: 0,
  session_starting: 1,
  auction: 2,
  dont_miss: 3,
  people_to_meet: 4,
  partner_spotlight: 5,
};

export function byPriority<T extends { type: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (PRIORITY[a.type] ?? 9) - (PRIORITY[b.type] ?? 9));
}
