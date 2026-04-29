// Records a mutual connection from a QR scan. The scanner sends the scanned
// attendee's qr_token; we resolve them, then insert a connection (smaller uuid first).

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { scanner_id, scanned_qr_token } = (await req.json()) as {
      scanner_id: string;
      scanned_qr_token: string;
    };
    const supabase = adminClient();

    const { data: scanner } = await supabase
      .from('attendees')
      .select('id, event_id')
      .eq('id', scanner_id)
      .single();
    const { data: scanned } = await supabase
      .from('attendees')
      .select('id, event_id')
      .eq('qr_token', scanned_qr_token)
      .single();

    if (!scanner || !scanned) throw new Error('Attendee not found');
    if (scanner.event_id !== scanned.event_id) throw new Error('Different events');
    if (scanner.id === scanned.id) throw new Error('Cannot connect with yourself');

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
        JSON.stringify({ ok: true, connection_id: existing.id, already: true }),
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
      JSON.stringify({ ok: true, connection_id: row.id, already: false }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
