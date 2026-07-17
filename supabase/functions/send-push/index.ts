// Fans out a notification row to Expo Push.
// Honours per-attendee category opt-outs and the 4-per-day cap (admin
// announcements bypass both). Prunes dead device tokens from Expo tickets.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { eligibleRecipients } from '../_shared/eligibility.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
};

const BATCH = 100;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { notification_id }: { notification_id: string } = await req.json();
    const supabase = adminClient();

    const { data: notification, error: nErr } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();
    if (nErr || !notification) throw new Error('Notification not found');

    const segment = notification.target_segment ?? {};
    let query = supabase
      .from('attendees')
      .select('id, push_token, notification_prefs')
      .eq('event_id', notification.event_id)
      .not('push_token', 'is', null);

    if (Array.isArray(segment.attendee_ids) && segment.attendee_ids.length) {
      query = query.in('id', segment.attendee_ids);
    }

    const { data: attendees, error: aErr } = await query;
    if (aErr) throw aErr;

    const isAdminAnnouncement = notification.type === 'admin_announcement';
    const today = new Date().toISOString().slice(0, 10);

    // One grouped query for today's delivery counts (no N+1).
    const ids = (attendees ?? []).map((a) => a.id);
    const counts = new Map<string, number>();
    if (!isAdminAnnouncement && ids.length) {
      const { data: delivered } = await supabase
        .from('notification_recipients')
        .select('attendee_id')
        .in('attendee_id', ids)
        .gte('delivered_at', `${today}T00:00:00Z`);
      for (const row of delivered ?? []) {
        counts.set(row.attendee_id, (counts.get(row.attendee_id) ?? 0) + 1);
      }
    }

    const eligible = eligibleRecipients(attendees ?? [], notification.type, counts);

    const messages: ExpoMessage[] = eligible.map((a) => ({
      to: a.push_token!,
      title: notification.title,
      body: notification.body,
      data: { ...(notification.data ?? {}), notification_id },
      sound: 'default',
    }));

    const deadTokenAttendees: string[] = [];
    for (let i = 0; i < messages.length; i += BATCH) {
      const chunk = messages.slice(i, i + BATCH);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(EXPO_TOKEN ? { authorization: `Bearer ${EXPO_TOKEN}` } : {}),
        },
        body: JSON.stringify(chunk),
      });
      if (res.ok) {
        const { data: tickets } = await res.json();
        (tickets ?? []).forEach((t: any, idx: number) => {
          if (t?.details?.error === 'DeviceNotRegistered') {
            deadTokenAttendees.push(eligible[i + idx].id);
          }
        });
      }
    }

    if (deadTokenAttendees.length) {
      await supabase
        .from('attendees')
        .update({ push_token: null })
        .in('id', deadTokenAttendees);
    }

    const recipientRows = eligible.map((a) => ({
      notification_id,
      attendee_id: a.id,
      delivered_at: new Date().toISOString(),
    }));
    if (recipientRows.length) {
      await supabase.from('notification_recipients').upsert(recipientRows);
    }

    await supabase
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notification_id);

    return new Response(
      JSON.stringify({ ok: true, sent: eligible.length, pruned: deadTokenAttendees.length }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
