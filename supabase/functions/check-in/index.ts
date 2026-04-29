// Marks an attendee as checked in. Called by:
//  • self check-in: attendee taps "I'm here" on Home
//  • staff QR scan: admin scans a personal QR at the door
//  • geofence prompt: app detects venue + bluetooth, prompts user

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { attendee_id, source } = (await req.json()) as {
      attendee_id: string;
      source?: 'self' | 'staff_qr' | 'geofence';
    };
    const supabase = adminClient();

    const { error } = await supabase
      .from('attendees')
      .update({ checked_in_at: new Date().toISOString() })
      .eq('id', attendee_id)
      .is('checked_in_at', null);
    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, source: source ?? 'self' }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
