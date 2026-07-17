-- Sprint 2: scheduling infrastructure + admin panel support.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Observability for scheduled jobs (AC sync, sweeps). Written by edge
-- functions with the service role; admins can read.
create table sync_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  detail jsonb not null default '{}'::jsonb
);

create index sync_runs_job_idx on sync_runs(job, started_at desc);
alter table sync_runs enable row level security;

create policy "sync runs admin read" on sync_runs
  for select using (exists (
    select 1 from admin_users a where a.user_id = auth.uid()
  ));

-- The admin panel writes audit rows through RLS — it needs an insert path.
create policy "audit log admin insert" on audit_log
  for insert with check (exists (
    select 1 from admin_users a where a.user_id = auth.uid()
  ));

-- Admins upload brand assets (headshots, partner logos, auction photos,
-- official gallery shots) from the admin panel.
create policy "admin upload brand assets" on storage.objects
  for insert with check (
    bucket_id in ('headshots', 'partner-logos', 'gallery', 'auction')
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

create policy "admin update brand assets" on storage.objects
  for update using (
    bucket_id in ('headshots', 'partner-logos', 'gallery', 'auction')
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );

create policy "admin delete brand assets" on storage.objects
  for delete using (
    bucket_id in ('headshots', 'partner-logos', 'gallery', 'auction')
    and exists (select 1 from admin_users a where a.user_id = auth.uid())
  );
