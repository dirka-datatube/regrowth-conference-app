// Per-day check-in. Three paths:
//  • self / geofence: attendee derived from the caller's JWT
//  • staff_qr: caller must be an admin; body carries the scanned qr_token
// attendees.checked_in_at stays as "first ever" for dashboard compatibility.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { requireAttendee, requireUser, adminForUser } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as {
      source?: 'self' | 'geofence';
      qr_token?: string;
    };
    const supabase = adminClient();

    let attendeeId: string;
    let source: string;

    if (body.qr_token) {
      // Staff scanning an attendee's QR at the door.
      const user = await requireUser(req, supabase);
      const admin = await adminForUser(user.id, supabase);
      if (!admin) throw new Error('ADMIN_ONLY');
      const token = body.qr_token.replace(/^regrowth:/, '').trim();
      const { data: scanned } = await supabase
        .from('attendees')
        .select('id')
        .eq('qr_token', token)
        .maybeSingle();
      if (!scanned) throw new Error('INVALID_QR');
      attendeeId = scanned.id;
      source = 'staff_qr';
    } else {
      const { attendee } = await requireAttendee(req, supabase);
      attendeeId = attendee.id;
      source = body.source === 'geofence' ? 'geofence' : 'self';
    }

    const { error: insertError } = await supabase
      .from('check_ins')
      .insert({ attendee_id: attendeeId, source });

    const already = insertError?.code === '23505'; // unique(attendee_id, day)
    if (insertError && !already) throw insertError;

    const now = new Date().toISOString();
    const { data: current } = await supabase
      .from('attendees')
      .select('checked_in_at')
      .eq('id', attendeeId)
      .single();
    await supabase
      .from('attendees')
      .update({ checked_in_at: current?.checked_in_at ?? now, last_seen_at: now })
      .eq('id', attendeeId);

    return new Response(
      JSON.stringify({ ok: true, already, source }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const msg = String(err instanceof Error ? err.message : err);
    const status = msg === 'UNAUTHENTICATED' ? 401 : ['NOT_AN_ATTENDEE', 'ADMIN_ONLY'].includes(msg) ? 403 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
