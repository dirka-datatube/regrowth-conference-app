// Extracts contact info from a photographed business card via Claude Vision.
// Initiator identity comes from the caller's JWT. Rate-limited per attendee
// per day (Claude Vision calls cost real money).

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { requireAttendee } from '../_shared/auth.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-5';
const DAILY_LIMIT = 25;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { image_base64, mime_type } = (await req.json()) as {
      image_base64: string;
      mime_type: 'image/jpeg' | 'image/png';
    };
    const supabase = adminClient();
    const { attendee } = await requireAttendee(req, supabase);

    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from('pending_connections')
      .select('*', { count: 'exact', head: true })
      .eq('initiator_id', attendee.id)
      .gte('created_at', `${today}T00:00:00Z`);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'RATE_LIMITED' }), {
        status: 429,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mime_type, data: image_base64 },
              },
              {
                type: 'text',
                text: 'Extract contact info from this business card. Return JSON only: {"name":"","company":"","email":"","phone":""}. Use null for missing fields.',
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json.content?.[0]?.text ?? '{}';

    let parsed: { name?: string; company?: string; email?: string; phone?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {};
    }

    // If the captured email belongs to a fellow attendee, surface that so the
    // client can offer an instant real connection.
    let matchedAttendeeId: string | null = null;
    if (parsed.email) {
      const { data: match } = await supabase
        .from('attendees')
        .select('id')
        .eq('event_id', attendee.event_id)
        .eq('email', parsed.email)
        .maybeSingle();
      matchedAttendeeId = match?.id ?? null;
    }

    const { data: row, error } = await supabase
      .from('pending_connections')
      .insert({
        event_id: attendee.event_id,
        initiator_id: attendee.id,
        captured_name: parsed.name ?? null,
        captured_company: parsed.company ?? null,
        captured_email: parsed.email ?? null,
        captured_phone: parsed.phone ?? null,
        resolved_attendee_id: matchedAttendeeId,
      })
      .select('id')
      .single();
    if (error) throw error;

    return new Response(
      JSON.stringify({
        ok: true,
        pending_id: row.id,
        extracted: parsed,
        matched_attendee_id: matchedAttendeeId,
      }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    const msg = String(err instanceof Error ? err.message : err);
    const status = msg === 'UNAUTHENTICATED' ? 401 : msg === 'NOT_AN_ATTENDEE' ? 403 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
