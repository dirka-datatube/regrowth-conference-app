// Posts a custom event to ActiveCampaign so their automations can fire.
// Used when: attendee taps "I'm interested" on a partner, completes onboarding,
// scans a QR connection, etc. All event email comms come from AC, not us.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

const AC_URL = Deno.env.get('ACTIVECAMPAIGN_API_URL');
const AC_KEY = Deno.env.get('ACTIVECAMPAIGN_API_KEY');

type Payload = {
  attendee_id: string;
  event_name: string;
  event_data?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { attendee_id, event_name, event_data }: Payload = await req.json();
    const supabase = adminClient();

    const { data: attendee, error } = await supabase
      .from('attendees')
      .select('email, ac_contact_id')
      .eq('id', attendee_id)
      .single();
    if (error || !attendee) throw new Error('Attendee not found');

    const res = await fetch(`${AC_URL}/api/3/eventTrackEvents`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_KEY!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        eventTrackEvent: {
          email: attendee.email,
          name: event_name,
          data: event_data ?? {},
        },
      }),
    });

    if (!res.ok) throw new Error(`AC emit failed: ${res.status}`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
