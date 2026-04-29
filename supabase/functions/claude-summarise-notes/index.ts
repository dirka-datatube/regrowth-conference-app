// Generates an AI summary for an attendee's session notes after the session
// ends. Called by client when the attendee opens a finished-session note,
// or by pg_cron 30 min after a session's end_at.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-4-5';

const SYSTEM_PROMPT = `You write summaries for REGROWTH®, a coaching brand for the real estate industry.

Voice rules:
- Use "we", never "I" or "you".
- Solutions-focused, never problem-focused. "Opportunities" not "problems".
- Warm, premium, confident.
- REGROWTH is always written in capitals.

Return JSON: { "summary": string (3-5 short paragraphs), "follow_up_questions": string[] (3 items) }.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { note_id }: { note_id: string } = await req.json();
    const supabase = adminClient();

    const { data: note, error } = await supabase
      .from('notes')
      .select(
        `id, body,
         session:sessions(title, abstract, start_at, end_at,
           speakers:session_speakers(speaker:speakers(name, title)))`,
      )
      .eq('id', note_id)
      .single();
    if (error || !note) throw new Error('Note not found');

    const sessionTitle = (note as any).session?.title ?? 'Session';
    const sessionAbstract = (note as any).session?.abstract ?? '';

    const userMessage = `Session: ${sessionTitle}
Abstract: ${sessionAbstract}

Attendee notes:
${note.body || '(no notes taken)'}

Produce the summary now.`;

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
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json.content?.[0]?.text ?? '{}';

    let parsed: { summary?: string; follow_up_questions?: string[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { summary: text, follow_up_questions: [] };
    }

    await supabase
      .from('notes')
      .update({
        ai_summary: parsed.summary ?? null,
        follow_up_questions: parsed.follow_up_questions ?? [],
        ai_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', note_id);

    return new Response(JSON.stringify({ ok: true, ...parsed }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
