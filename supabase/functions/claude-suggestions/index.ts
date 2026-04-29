// Daily "people you should meet" + "partners worth checking out" suggestions
// for an attendee. Cached in daily_suggestions for that date.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-5';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { attendee_id }: { attendee_id: string } = await req.json();
    const supabase = adminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: cached } = await supabase
      .from('daily_suggestions')
      .select('*')
      .eq('attendee_id', attendee_id)
      .eq('for_date', today)
      .maybeSingle();
    if (cached) {
      return new Response(JSON.stringify({ ok: true, cached: true, ...cached }), {
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const { data: me } = await supabase
      .from('attendees')
      .select('id, name, role, company, interests, event_id')
      .eq('id', attendee_id)
      .single();
    if (!me) throw new Error('attendee not found');

    const { data: candidates } = await supabase
      .from('attendees')
      .select('id, name, role, company, interests')
      .eq('event_id', me.event_id)
      .neq('id', attendee_id)
      .neq('visibility', 'hidden')
      .limit(200);

    const { data: partners } = await supabase
      .from('partners')
      .select('id, name, description, tags')
      .eq('event_id', me.event_id);

    const prompt = `You match conference attendees for REGROWTH®. Pick the 3 best people for the user to meet and the 2 best partners to check out, based on overlapping or complementary interests.

User: ${JSON.stringify(me)}

Candidates: ${JSON.stringify(candidates)}

Partners: ${JSON.stringify(partners)}

Return JSON only: {"attendee_ids": [uuid, uuid, uuid], "partner_ids": [uuid, uuid], "rationale": {"<id>": "<one short reason>"}}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json.content?.[0]?.text ?? '{}';

    let parsed: {
      attendee_ids?: string[];
      partner_ids?: string[];
      rationale?: Record<string, string>;
    } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    const row = {
      attendee_id,
      for_date: today,
      suggested_attendee_ids: parsed.attendee_ids ?? [],
      suggested_partner_ids: parsed.partner_ids ?? [],
      rationale: parsed.rationale ?? {},
    };
    await supabase.from('daily_suggestions').upsert(row);

    return new Response(JSON.stringify({ ok: true, cached: false, ...row }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
