// Posts a custom event to ActiveCampaign so their automations can fire.
// The attendee is derived from the caller's JWT; event names are
// allow-listed so the endpoint can't be used to spray arbitrary AC events.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { requireAttendee } from '../_shared/auth.ts';

const AC_URL = Deno.env.get('ACTIVECAMPAIGN_API_URL');
const AC_KEY = Deno.env.get('ACTIVECAMPAIGN_API_KEY');

const ALLOWED_EVENTS = new Set([
  'partner_interest',
  'onboarding_complete',
  'notes_export',
  'connection_made',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { event_name, event_data } = (await req.json()) as {
      event_name: string;
      event_data?: Record<string, unknown>;
    };
    if (!ALLOWED_EVENTS.has(event_name)) throw new Error('EVENT_NOT_ALLOWED');

    const supabase = adminClient();
    const { attendee } = await requireAttendee(req, supabase);

    if (!AC_URL || !AC_KEY) {
      // AC not configured yet — record intent, succeed quietly so app flows
      // don't break in pre-integration environments.
      return new Response(JSON.stringify({ ok: true, skipped: 'AC_NOT_CONFIGURED' }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const res = await fetch(`${AC_URL}/api/3/eventTrackEvents`, {
      method: 'POST',
      headers: {
        'Api-Token': AC_KEY,
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
    const msg = String(err instanceof Error ? err.message : err);
    const status = msg === 'UNAUTHENTICATED' ? 401 : msg === 'NOT_AN_ATTENDEE' ? 403 : msg === 'EVENT_NOT_ALLOWED' ? 400 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
