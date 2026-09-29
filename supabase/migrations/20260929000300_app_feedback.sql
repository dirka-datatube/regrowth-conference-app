-- App feedback (Figma "NEW: Event App" v2 — Sprint 11)
--
-- Two Profile screens send REGROWTH a message about the app itself:
--
--   Rate App (227:2617, thank-you 227:2741)  kind = 'rating'
--     1–5 stars, the "What did you enjoy?" chips (tags), an optional comment.
--   Contact (227:2914)                       kind = 'contact'
--     name, reply-to email, subject and message from the contact form.
--
-- A row belongs to the account (auth.users), not to an attendees row: since
-- accounts opened up in the v2 design, someone can rate the app or get in touch
-- before they hold a registration. `user_id` defaults to the caller, so the app
-- never sends it. Deleting the account keeps the feedback and drops the link.
--
-- The contact form asks for a name, so the table carries `name` beside the
-- columns the brief listed. It is prefilled from the attendee and may differ —
-- someone writing on a colleague's behalf.
--
-- The app only ever inserts. Attendees may read their own rows, so a later
-- "your messages" view needs no migration; admins read everything until the
-- admin panel grows an inbox.

create table app_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  kind text not null check (kind in ('rating', 'contact')),
  rating smallint check (rating between 1 and 5),
  tags text[] not null default '{}',
  subject text,
  message text,
  email text,
  name text,
  created_at timestamptz not null default now(),

  -- A rating carries its stars; a contact message carries a message.
  constraint app_feedback_rating_has_stars
    check (kind <> 'rating' or rating is not null),
  constraint app_feedback_contact_has_message
    check (kind <> 'contact' or coalesce(btrim(message), '') <> ''),
  -- Free text straight from a client: hold it to what the forms allow.
  constraint app_feedback_text_lengths check (
    char_length(coalesce(message, '')) <= 5000
    and char_length(coalesce(subject, '')) <= 200
    and char_length(coalesce(name, '')) <= 200
    and char_length(coalesce(email, '')) <= 320
    and cardinality(tags) <= 20
  )
);

comment on table app_feedback is
  'App ratings (Rate App) and messages from the Contact screen. Written by the app, read by admins.';
comment on column app_feedback.tags is
  'Rate App: the "What did you enjoy?" chips the attendee selected.';
comment on column app_feedback.email is
  'Contact: where REGROWTH should reply. Prefilled from the attendee, editable.';

-- The admin inbox lists newest first, per kind.
create index app_feedback_kind_created_idx on app_feedback (kind, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS. Signed-in accounts insert as themselves and read their own rows. Admins
-- read every row: feedback is about the app, not an event, so the check is
-- "is an admin at all" rather than is_admin_for(event_id). Nobody updates or
-- deletes from the app; the service role and the dashboard are unaffected.
--
-- The admin check runs inside a security definer function, like
-- is_admin_for(). Written inline in the policy it would read admin_users under
-- admin_users' own RLS, whose "admin users self read" policy selects from
-- admin_users again — Postgres rejects that with "infinite recursion detected
-- in policy for relation admin_users", which would fail every read of this
-- table, admins' and attendees' alike.
-- ---------------------------------------------------------------------------
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- RLS helper: executable by authenticated (the policy needs it), not anon —
-- the same grants as the helpers in 20260101000300.
revoke execute on function public.is_app_admin() from anon, public;
grant execute on function public.is_app_admin() to authenticated;

alter table app_feedback enable row level security;

create policy "app feedback insert self" on app_feedback
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "app feedback read own" on app_feedback
  for select to authenticated
  using (user_id = auth.uid());

create policy "app feedback admins read" on app_feedback
  for select to authenticated
  using (public.is_app_admin());
