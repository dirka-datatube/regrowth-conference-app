// Extracts contact info from a photographed business card via Claude Vision.
// Creates a pending_connections row the other person can claim/confirm.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-5';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { initiator_id, image_base64, mime_type } = (await req.json()) as {
      initiator_id: string;
      image_base64: string;
      mime_type: 'image/jpeg' | 'image/png';
    };

    const supabase = adminClient();
    const { data: me } = await supabase
      .from('attendees')
      .select('event_id')
      .eq('id', initiator_id)
      .single();
    if (!me) throw new Error('attendee not found');

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

    const { data: row, error } = await supabase
      .from('pending_connections')
      .insert({
        event_id: me.event_id,
        initiator_id,
        captured_name: parsed.name ?? null,
        captured_company: parsed.company ?? null,
        captured_email: parsed.email ?? null,
        captured_phone: parsed.phone ?? null,
      })
      .select('id')
      .single();
    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, pending_id: row.id, extracted: parsed }),
      { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
