-- Support chat (Figma "NEW: Event App" v2 — Customer Support 73:453)
--
-- /support is an assistant-style chat. The REGROWTH Assistant answers common
-- questions on the device (lib/support.ts) and never writes here; every
-- message the attendee sends is stored, so the team can read the thread and
-- reply into it. "Connect" on the chat's escalation card sends a message with
-- needs_human = true, which is what a staff inbox filters on.
--
-- One thread per account: rows belong to an auth user rather than an
-- attendee, so someone can ask for help before (or without) a registration.
-- The app polls the thread while the chat is open; no realtime publication
-- is needed.

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  -- The thread's owner. Staff replies carry the attendee's user_id too.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and char_length(body) <= 2000),
  from_staff boolean not null default false,
  -- Set on the message sent by "Connect": the attendee wants a person.
  needs_human boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.support_messages is
  'In-app support chat (/support). Attendee messages and staff replies, one thread per user. The assistant''s automated answers are derived on the device and not stored.';

create index if not exists support_messages_user_created_idx
  on public.support_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Who counts as support staff: anyone in admin_users. A security definer
-- helper, like is_admin_for(), because a policy that queries admin_users
-- inline runs into admin_users' own policy, which reads admin_users again
-- (infinite recursion in RLS).
-- ---------------------------------------------------------------------------
create or replace function public.is_support_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

revoke execute on function public.is_support_staff() from anon, public;
grant execute on function public.is_support_staff() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS. Attendees read their own thread and post into it as themselves, never
-- as staff; nobody edits or deletes messages from the app. Staff read every
-- thread and reply into any of them.
-- ---------------------------------------------------------------------------
alter table public.support_messages enable row level security;

grant select, insert on public.support_messages to authenticated;

drop policy if exists "support messages own read" on public.support_messages;
create policy "support messages own read" on public.support_messages
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "support messages own insert" on public.support_messages;
create policy "support messages own insert" on public.support_messages
  for insert to authenticated
  with check (user_id = auth.uid() and from_staff = false);

drop policy if exists "support messages staff read" on public.support_messages;
create policy "support messages staff read" on public.support_messages
  for select to authenticated
  using (public.is_support_staff());

drop policy if exists "support messages staff reply" on public.support_messages;
create policy "support messages staff reply" on public.support_messages
  for insert to authenticated
  with check (public.is_support_staff());
