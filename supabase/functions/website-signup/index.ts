// Webhook endpoint hit by the REGROWTH website signup form.
// Upserts an attendee row and triggers an AC welcome automation.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

const SECRET = Deno.env.get('WEBSITE_WEBHOOK_SECRET');

type Payload = {
  event_id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  interests?: string[];
  dietary?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.headers.get('x-webhook-secret') !== SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body: Payload = await req.json();
    const supabase = adminClient();

    const { data, error } = await supabase
      .from('attendees')
      .upsert(
        {
          event_id: body.event_id,
          email: body.email,
          name: body.name,
          company: body.company ?? null,
          role: body.role ?? null,
          interests: body.interests ?? [],
          dietary: body.dietary ?? null,
        },
        { onConflict: 'event_id,email' },
      )
      .select('id')
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, attendee_id: data.id }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
