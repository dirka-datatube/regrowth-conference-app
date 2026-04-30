// Pulls contacts from ActiveCampaign and upserts to attendees.
// Scheduled: every 15 minutes via Supabase cron (pg_cron) or Vercel cron.
// Source-of-truth for attendee email/name/company is ActiveCampaign.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

type AcContact = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organization?: string;
  fieldValues?: Array<{ field: string; value: string }>;
};

const AC_URL = Deno.env.get('ACTIVECAMPAIGN_API_URL');
const AC_KEY = Deno.env.get('ACTIVECAMPAIGN_API_KEY');
const AC_LIST_ID = Deno.env.get('ACTIVECAMPAIGN_LIST_ID');

async function fetchContacts(offset = 0, limit = 100): Promise<AcContact[]> {
  if (!AC_URL || !AC_KEY || !AC_LIST_ID) {
    throw new Error('ActiveCampaign env vars missing');
  }
  const url = `${AC_URL}/api/3/contacts?listid=${AC_LIST_ID}&limit=${limit}&offset=${offset}`;
  const res = await fetch(url, { headers: { 'Api-Token': AC_KEY } });
  if (!res.ok) throw new Error(`AC fetch failed: ${res.status}`);
  const json = await res.json();
  return json.contacts ?? [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get('event_id');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'event_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const supabase = adminClient();
    let offset = 0;
    let processed = 0;

    while (true) {
      const contacts = await fetchContacts(offset, 100);
      if (contacts.length === 0) break;

      const rows = contacts.map((c) => ({
        event_id: eventId,
        ac_contact_id: c.id,
        email: c.email,
        name: [c.firstName, c.lastName].filter(Boolean).join(' ').trim(),
        company: c.organization ?? null,
      }));

      const { error } = await supabase
        .from('attendees')
        .upsert(rows, { onConflict: 'ac_contact_id' });
      if (error) throw error;

      processed += rows.length;
      offset += contacts.length;
      if (contacts.length < 100) break;
    }

    return new Response(JSON.stringify({ ok: true, processed }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
