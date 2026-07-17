import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { eligibleRecipients, byPriority, DAILY_CAP } from '../_shared/eligibility.ts';

const att = (id: string, prefs: Record<string, unknown> = {}, token: string | null = 'tok') => ({
  id,
  push_token: token,
  notification_prefs: prefs,
});

Deno.test('opt-out skips the category', () => {
  const out = eligibleRecipients(
    [att('a', { auction: false }), att('b')],
    'auction',
    new Map(),
  );
  assertEquals(out.map((a) => a.id), ['b']);
});

Deno.test('cap drops the 5th non-admin push', () => {
  const counts = new Map([['a', DAILY_CAP], ['b', DAILY_CAP - 1]]);
  const out = eligibleRecipients([att('a'), att('b')], 'session_starting', counts);
  assertEquals(out.map((a) => a.id), ['b']);
});

Deno.test('admin announcements bypass cap and opt-outs', () => {
  const counts = new Map([['a', 99]]);
  const out = eligibleRecipients(
    [att('a', { admin_announcement: false })],
    'admin_announcement',
    counts,
  );
  assertEquals(out.length, 1);
});

Deno.test('missing push token is never eligible', () => {
  const out = eligibleRecipients([att('a', {}, null)], 'admin_announcement', new Map());
  assertEquals(out.length, 0);
});

Deno.test('queue drains highest priority first', () => {
  const ordered = byPriority([
    { type: 'partner_spotlight' },
    { type: 'admin_announcement' },
    { type: 'auction' },
    { type: 'session_starting' },
  ]);
  assertEquals(
    ordered.map((r) => r.type),
    ['admin_announcement', 'session_starting', 'auction', 'partner_spotlight'],
  );
});
