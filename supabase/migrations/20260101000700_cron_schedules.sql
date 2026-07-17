-- Scheduled pipelines (pg_cron -> pg_net -> edge functions).
-- Times are UTC; the event runs in Australia/Perth (UTC+8).
-- The bearer is the project's anon key (public by design) — it satisfies the
-- gateway JWT check; functions do privileged work via their own service key.

create or replace function cron_headers() returns jsonb
language sql immutable
as $$
  select jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsY2ZlZ3VxaG5nZ3l4dmV4Z2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNTc1ODAsImV4cCI6MjA5OTgzMzU4MH0.o3rsf9flmvFrgyMip_F-dybKNiBs2J_MeeJfq3mU98Y'
  );
$$;

revoke execute on function cron_headers() from anon, authenticated, public;

-- ActiveCampaign sync every 15 minutes (errors cleanly until AC creds are set).
select cron.schedule(
  'ac-sync-attendees',
  '4,19,34,49 * * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/ac-sync-attendees?event_id=00000000-0000-0000-0000-000000000001',
      headers := cron_headers(),
      body := '{}'::jsonb
  )$$
);

-- Notification queue: deliver due notifications (outbid alerts, scheduled
-- admin pushes, sweep-generated reminders) every minute.
select cron.schedule(
  'process-notification-queue',
  '* * * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/scheduled-tasks',
      headers := cron_headers(),
      body := '{"job":"process_queue"}'::jsonb
  )$$
);

-- Session-starting reminders (~15 min before) every 5 minutes.
select cron.schedule(
  'session-starting-sweep',
  '*/5 * * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/scheduled-tasks',
      headers := cron_headers(),
      body := '{"job":"session_starting"}'::jsonb
  )$$
);

-- AI note summaries for sessions that ended recently, twice an hour.
select cron.schedule(
  'note-summaries-sweep',
  '12,42 * * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/scheduled-tasks',
      headers := cron_headers(),
      body := '{"job":"note_summaries"}'::jsonb
  )$$
);

-- Daily suggestions: re-entrant batches (25 attendees/run) every 10 minutes
-- through the 22:00–23:59 UTC window (06:00–08:00 Perth).
select cron.schedule(
  'daily-suggestions',
  '2,12,22,32,42,52 22,23 * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/scheduled-tasks',
      headers := cron_headers(),
      body := '{"job":"daily_suggestions"}'::jsonb
  )$$
);

-- "People to meet" nudge at 08:37 Perth (00:37 UTC).
select cron.schedule(
  'people-to-meet',
  '37 0 * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/scheduled-tasks',
      headers := cron_headers(),
      body := '{"job":"people_to_meet"}'::jsonb
  )$$
);
