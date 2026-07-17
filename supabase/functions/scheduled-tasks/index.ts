// Dispatcher for cron-driven jobs (see migrations 20260101000700/000800):
//   process_queue      — deliver due notifications, highest priority first
//   session_starting   — queue T-15 reminders for picks + followed speakers
//   note_summaries     — AI-summarise notes for recently ended sessions
//   daily_suggestions  — batch-generate people/partner suggestions
//   people_to_meet     — queue one daily suggested-person nudge
//   dont_miss          — concurrent sessions ~30 min out, no pick yet
//   podcast_sync       — mirror the Impact & Influence RSS feed
//
// Callers: pg_cron (anon bearer) or internal service calls. End-user JWTs
// (role "authenticated") are rejected — job effects are global, not per-user.

import { corsHeaders } from '../_shared/cors.ts';
import { adminClient } from '../_shared/supabase.ts';
import { jwtRole } from '../_shared/auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PRIORITY: Record<string, number> = {
  admin_announcement: 0,
  session_starting: 1,
  auction: 2,
  dont_miss: 3,
  people_to_meet: 4,
  partner_spotlight: 5,
};

async function invokeFn(name: string, body: unknown): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

async function processQueue(supabase: ReturnType<typeof adminClient>) {
  const { data: due } = await supabase
    .from('notifications')
    .select('id, type')
    .is('sent_at', null)
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(30);

  const ordered = (due ?? []).sort(
    (a, b) => (PRIORITY[a.type] ?? 9) - (PRIORITY[b.type] ?? 9),
  );

  let sent = 0;
  for (const n of ordered) {
    if (await invokeFn('send-push', { notification_id: n.id })) sent++;
  }
  return { due: ordered.length, sent };
}

async function sessionStarting(supabase: ReturnType<typeof adminClient>) {
  const from = new Date(Date.now() + 13 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + 18 * 60 * 1000).toISOString();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, event_id, title, room, start_at, speakers:session_speakers(speaker_id)')
    .eq('is_published', true)
    .gte('start_at', from)
    .lte('start_at', to);

  let queued = 0;
  for (const s of sessions ?? []) {
    // One reminder per session, ever.
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'session_starting')
      .eq('data->>session_id', s.id)
      .maybeSingle();
    if (existing) continue;

    const speakerIds = (s.speakers ?? []).map((row: any) => row.speaker_id);

    const { data: picks } = await supabase
      .from('schedule_picks')
      .select('attendee_id')
      .eq('session_id', s.id);

    let followerIds: string[] = [];
    if (speakerIds.length) {
      const { data: followers } = await supabase
        .from('speaker_followers')
        .select('attendee_id')
        .in('speaker_id', speakerIds);
      followerIds = (followers ?? []).map((f) => f.attendee_id);
    }

    const recipients = [
      ...new Set([...(picks ?? []).map((p) => p.attendee_id), ...followerIds]),
    ];
    if (!recipients.length) continue;

    await supabase.from('notifications').insert({
      event_id: s.event_id,
      type: 'session_starting',
      title: 'Starting in 15 minutes',
      body: `${s.title}${s.room ? ` · ${s.room}` : ''} — we'll see you there.`,
      data: { route: `/session/${s.id}`, session_id: s.id },
      target_segment: { attendee_ids: recipients },
      scheduled_at: new Date().toISOString(),
    });
    queued++;
  }
  return { sessions: (sessions ?? []).length, queued };
}

async function noteSummaries(supabase: ReturnType<typeof adminClient>) {
  const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const to = new Date(Date.now() - 20 * 60 * 1000).toISOString();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id')
    .gte('end_at', from)
    .lte('end_at', to);
  const ids = (sessions ?? []).map((s) => s.id);
  if (!ids.length) return { notes: 0 };

  const { data: notes } = await supabase
    .from('notes')
    .select('id')
    .in('session_id', ids)
    .neq('body', '')
    .is('ai_summary', null)
    .limit(20);

  let ok = 0;
  for (const n of notes ?? []) {
    if (await invokeFn('claude-summarise-notes', { note_id: n.id })) ok++;
  }
  return { notes: (notes ?? []).length, summarised: ok };
}

async function dailySuggestions(supabase: ReturnType<typeof adminClient>) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: done } = await supabase
    .from('daily_suggestions')
    .select('attendee_id')
    .eq('for_date', today);
  const doneIds = new Set((done ?? []).map((d) => d.attendee_id));

  const { data: attendees } = await supabase
    .from('attendees')
    .select('id')
    .neq('visibility', 'hidden')
    .limit(500);

  const pending = (attendees ?? []).filter((a) => !doneIds.has(a.id)).slice(0, 25);

  let ok = 0;
  for (const a of pending) {
    if (await invokeFn('claude-suggestions', { attendee_id: a.id })) ok++;
  }
  return { pending: pending.length, generated: ok };
}

async function peopleToMeet(supabase: ReturnType<typeof adminClient>) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: alreadyQueued } = await supabase
    .from('notifications')
    .select('target_segment')
    .eq('type', 'people_to_meet')
    .eq('data->>for_date', today);
  const queuedIds = new Set(
    (alreadyQueued ?? []).flatMap((n: any) => n.target_segment?.attendee_ids ?? []),
  );

  const { data: suggestions } = await supabase
    .from('daily_suggestions')
    .select('attendee_id, suggested_attendee_ids, rationale')
    .eq('for_date', today)
    .limit(200);

  let queued = 0;
  for (const s of suggestions ?? []) {
    if (queuedIds.has(s.attendee_id)) continue;
    const suggestedId = s.suggested_attendee_ids?.[0];
    if (!suggestedId) continue;

    const { data: person } = await supabase
      .from('attendees')
      .select('name, company, event_id')
      .eq('id', suggestedId)
      .maybeSingle();
    if (!person) continue;

    const reason = (s.rationale as Record<string, string>)?.[suggestedId];
    await supabase.from('notifications').insert({
      event_id: person.event_id,
      type: 'people_to_meet',
      title: `You should meet ${person.name}`,
      body: reason ?? `${person.name}${person.company ? ` from ${person.company}` : ''} would be a great conversation today.`,
      data: { route: `/attendees/${suggestedId}`, for_date: today },
      target_segment: { attendee_ids: [s.attendee_id] },
      scheduled_at: new Date().toISOString(),
    });
    queued++;
  }
  return { queued };
}

async function dontMiss(supabase: ReturnType<typeof adminClient>) {
  const from = new Date(Date.now() + 25 * 60 * 1000).toISOString();
  const to = new Date(Date.now() + 35 * 60 * 1000).toISOString();

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, event_id, title, start_at')
    .eq('is_published', true)
    .gte('start_at', from)
    .lte('start_at', to);
  if (!sessions || sessions.length < 2) return { concurrent: sessions?.length ?? 0, queued: 0 };

  const windowKey = sessions.map((s) => s.id).sort().join(',').slice(0, 64);
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('type', 'dont_miss')
    .eq('data->>window', windowKey)
    .maybeSingle();
  if (existing) return { concurrent: sessions.length, queued: 0 };

  const sessionIds = sessions.map((s) => s.id);
  const { data: picks } = await supabase
    .from('schedule_picks')
    .select('attendee_id')
    .in('session_id', sessionIds);
  const pickedIds = new Set((picks ?? []).map((p) => p.attendee_id));

  const { data: attendees } = await supabase
    .from('attendees')
    .select('id')
    .eq('event_id', sessions[0].event_id)
    .not('push_token', 'is', null)
    .limit(500);
  const recipients = (attendees ?? []).map((a) => a.id).filter((id) => !pickedIds.has(id));
  if (!recipients.length) return { concurrent: sessions.length, queued: 0 };

  await supabase.from('notifications').insert({
    event_id: sessions[0].event_id,
    type: 'dont_miss',
    title: "Don't miss this",
    body: `${sessions.length} sessions start in ~30 minutes — pick the one for you.`,
    data: { route: '/agenda', window: windowKey },
    target_segment: { attendee_ids: recipients },
    scheduled_at: new Date().toISOString(),
  });
  return { concurrent: sessions.length, queued: 1, recipients: recipients.length };
}

async function podcastSync(supabase: ReturnType<typeof adminClient>) {
  const feedUrl = Deno.env.get('PODCAST_RSS_URL');
  if (!feedUrl) return { skipped: 'PODCAST_RSS_URL not set' };

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .order('start_date', { ascending: false })
    .limit(1)
    .single();
  if (!event) return { skipped: 'no event' };

  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20);
  const pick = (block: string, tag: string) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
    return m?.[1]?.trim() ?? null;
  };

  let upserted = 0;
  for (const [, block] of items) {
    const title = pick(block, 'title');
    const audio = block.match(/<enclosure[^>]*url="([^"]+)"/)?.[1] ?? null;
    if (!title || !audio) continue;
    const pub = pick(block, 'pubDate');
    const { error } = await supabase.from('podcast_episodes').upsert(
      {
        event_id: event.id,
        title,
        description: pick(block, 'description')?.replace(/<[^>]+>/g, '').slice(0, 500) ?? null,
        audio_url: audio,
        episode_url: pick(block, 'link'),
        published_at: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      },
      { onConflict: 'audio_url', ignoreDuplicates: false } as any,
    );
    if (!error) upserted++;
  }
  return { items: items.length, upserted };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const started = new Date().toISOString();
  const supabase = adminClient();
  let job = 'unknown';

  try {
    if (jwtRole(req) === 'authenticated') {
      return new Response(JSON.stringify({ error: 'FORBIDDEN' }), {
        status: 403,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const body = (await req.json()) as { job: string };
    job = body.job;

    let detail: Record<string, unknown>;
    switch (job) {
      case 'process_queue':
        detail = await processQueue(supabase);
        break;
      case 'session_starting':
        detail = await sessionStarting(supabase);
        break;
      case 'note_summaries':
        detail = await noteSummaries(supabase);
        break;
      case 'daily_suggestions':
        detail = await dailySuggestions(supabase);
        break;
      case 'people_to_meet':
        detail = await peopleToMeet(supabase);
        break;
      case 'dont_miss':
        detail = await dontMiss(supabase);
        break;
      case 'podcast_sync':
        detail = await podcastSync(supabase);
        break;
      default:
        throw new Error(`Unknown job: ${job}`);
    }

    // Keep the queue sweep quiet in sync_runs unless it did something.
    if (job !== 'process_queue' || (detail.sent as number) > 0) {
      await supabase.from('sync_runs').insert({
        job,
        started_at: started,
        finished_at: new Date().toISOString(),
        ok: true,
        detail,
      });
    }

    return new Response(JSON.stringify({ ok: true, job, ...detail }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    await supabase.from('sync_runs').insert({
      job,
      started_at: started,
      finished_at: new Date().toISOString(),
      ok: false,
      detail: { error: String(err) },
    });
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
