// Records a mutual connection from a QR scan. The scanner identity comes
// from the caller's JWT (never the request body); the request carries only
// the scanned attendee's qr_token.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { requireAttendee } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { scanned_qr_token } = (await req.json()) as { scanned_qr_token: string };
    const supabase = adminClient();
    const { attendee: scanner } = await requireAttendee(req, supabase);

    // QR payloads are prefixed "regrowth:<token>"; accept bare tokens too.
    const token = String(scanned_qr_token ?? '').replace(/^regrowth:/, '').trim();
    if (!token) throw new Error('INVALID_QR');

    const { data: scanned } = await supabase
      .from('attendees')
      .select('id, event_id, name')
      .eq('qr_token', token)
      .maybeSingle();

    if (!scanned) throw new Error('INVALID_QR');
    if (scanner.event_id !== scanned.event_id) throw new Error('DIFFERENT_EVENT');
    if (scanner.id === scanned.id) throw new Error('CANNOT_CONNECT_SELF');

    const [a, b] = [scanner.id, scanned.id].sort();

    const { data: existing } = await supabase
      .from('connections')
      .select('id')
      .eq('event_id', scanner.event_id)
      .eq('attendee_a', a)
      .eq('attendee_b', b)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ ok: true, connection_id: existing.id, already: true, name: scanned.name }),
        { headers: { ...corsHeaders, 'content-type': 'application/json' } },
      );
    }

    const { data: row, error } = await supabase
      .from('connections')
      .insert({
        event_id: scanner.event_id,
        attendee_a: a,
        attendee_b: b,
        source: 'qr_scan',
      })
      .select('id')
      .single();
    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, connection_id: row.id, already: false, name: scanned.name }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const msg = String(err instanceof Error ? err.message : err);
    const status = msg === 'UNAUTHENTICATED' ? 401 : msg === 'NOT_AN_ATTENDEE' ? 403 : 400;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
