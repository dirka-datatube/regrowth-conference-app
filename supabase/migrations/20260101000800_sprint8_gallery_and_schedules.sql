-- Sprint 8: attendee gallery uploads + two new scheduled jobs.

-- Attendees can add their own photos to the shared gallery (storage insert
-- policy for the gallery bucket already exists).
create policy "gallery attendee insert own" on gallery_items
  for insert with check (
    taken_by = current_attendee_id()
    and event_id = current_attendee_event_id()
  );

-- "Don't miss this": concurrent sessions ~30 min out where the attendee
-- picked none — one nudge.
select cron.schedule(
  'dont-miss-sweep',
  '3,13,23,33,43,53 * * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/scheduled-tasks',
      headers := cron_headers(),
      body := '{"job":"dont_miss"}'::jsonb
  )$$
);

-- Impact & Influence podcast RSS mirror, daily at 18:23 UTC (02:23 Perth).
select cron.schedule(
  'podcast-sync',
  '23 18 * * *',
  $$select net.http_post(
      url := 'https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/scheduled-tasks',
      headers := cron_headers(),
      body := '{"job":"podcast_sync"}'::jsonb
  )$$
);
