-- Open sign-up: anyone can create an account (Figma v2 — Log in 25:260,
-- Sign up 34:767)
--
-- The client's decision (2026-09): "make it easy for people to sign up and log
-- in". Anyone can now create an account with an email and a password; most
-- people use their company email. An account is a person. Registering for an
-- event (paid on the website) is what unlocks that event, and an account
-- without a registration sees the app in its "not registered" state.
--
-- Until now handle_new_auth_user() (20260101000200) refused any email that was
-- not already an attendee or an admin, so only people the website had
-- registered could use the app at all. This migration:
--
--   1. creates `profiles`, the person behind an account: name, phone, photo,
--      company, role. It exists whether or not they are registered, so an
--      account without a registration still has a name. (Sprint 08 moves the
--      registration itself out of `attendees` into `registrations`.)
--   2. replaces handle_new_auth_user() so that creating an account never
--      fails. It writes the profile from the sign-up form (user metadata),
--      links the person's registration if the website or ActiveCampaign got
--      there first, and links admin_users as before.
--   3. links a registration that arrives AFTER the account — someone signs up
--      in the app, then pays on the website — when its attendee row is
--      inserted, and once now for rows already waiting.
--   4. backfills a profile for every existing account.
--   5. lets any signed-in account read event information (events, speakers,
--      the published agenda, partners, the podcast, FAQs) so an unregistered
--      account can browse what it could register for. These policies are
--      additional; the attendee-scoped ones stay. Everything personal —
--      attendees, notes, connections, questions, notifications — stays
--      registration-scoped.
--
-- Linking trusts the email address. Supabase Auth must keep "Confirm email"
-- on: with it off, anyone could sign up with someone else's address and be
-- signed straight into their registration.
--
-- attendees.user_id is unique, so an account still links to at most one
-- attendee row. When one email has several unclaimed rows (one per event),
-- the confirmed registration for the soonest event is linked and the rest
-- wait for Sprint 08's `registrations`, which lifts the
-- one-registration-per-account limit.

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null,
  first_name text,
  last_name text,
  phone text,
  photo_url text,
  company text,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'The person behind an account, registered or not. One row per auth.users row, written by handle_new_auth_user().';
comment on column public.profiles.email is
  'The account email when the profile was created. Owned by Supabase Auth; not editable here.';

create index profiles_email_idx on public.profiles (email);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- "Is this account an admin at all?" — profiles are not per event, so
-- is_admin_for(event_id) does not fit. It must run as security definer:
-- written inline in a policy, the check would read admin_users under
-- admin_users' own RLS, whose "admin users self read" policy selects from
-- admin_users again, and Postgres rejects that ("infinite recursion detected
-- in policy for relation admin_users") on every read of the table.
-- Identical to the helper 20260929000300_app_feedback.sql defines; whichever
-- migration runs first creates it and the other replaces it unchanged.
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

alter table public.profiles enable row level security;

create policy "profiles self read" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles self update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles admins read" on public.profiles
  for select to authenticated
  using (public.is_app_admin());

-- RLS picks the row; column privileges pick the fields. The id and email
-- belong to Supabase Auth, so people may edit everything else about
-- themselves, but not those. Rows are written only by the trigger below and
-- removed with the account (on delete cascade).
revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (first_name, last_name, phone, photo_url, company, role) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- ---------------------------------------------------------------------------
-- 2. New accounts: profile + links, never a refusal
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Phone and anonymous sign-ins (both off) create accounts without an email:
  -- nothing to link, and no profile to key on it.
  if new.email is null then
    return new;
  end if;

  -- Linking must never cost someone their account: if it fails, the account
  -- is created unlinked (the app shows "not registered") and the warning
  -- lands in the Postgres log for support to fix by hand.
  begin
    -- The registration, if the website or ActiveCampaign got there first.
    update public.attendees
    set user_id = new.id
    where id = (
      select a.id
      from public.attendees a
      join public.events e on e.id = a.event_id
      where a.email = new.email::citext
        and a.user_id is null
      order by (a.registration_status = 'confirmed') desc, e.start_date, a.created_at
      limit 1
    );

    update public.admin_users
    set user_id = new.id
    where email = new.email::citext;
  exception when others then
    raise warning 'handle_new_auth_user: could not link account % (%)', new.id, sqlerrm;
  end;

  -- The person. Sign-up sends the form's name and phone as user metadata; an
  -- account made another way (an email link, the dashboard) has none, and
  -- takes its name, photo, company and role from the registration linked
  -- above, if any.
  insert into public.profiles (id, email, first_name, last_name, phone, photo_url, company, role)
  select
    new.id,
    new.email,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'first_name'), ''), substring(btrim(a.name) from '^\S+')),
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'last_name'), ''),
      nullif(regexp_replace(btrim(a.name), '^\S+\s*', ''), '')
    ),
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    a.photo_url,
    a.company,
    a.role
  from (select 1) as one
  left join public.attendees a on a.user_id = new.id
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger functions must not be RPC-callable (see 20260101000300). The
-- on_auth_user_created trigger itself is unchanged.
revoke execute on function public.handle_new_auth_user() from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- 3. Registrations that arrive after the account
-- ---------------------------------------------------------------------------
-- The website webhook (website-signup) and the ActiveCampaign sync insert
-- attendee rows without a user_id. If an account already exists for the
-- email and holds no registration yet, the new row is linked to it — without
-- this, someone who signs up in the app and then pays on the website would
-- stay "not registered". Rows inserted with a user_id are left alone.
create or replace function public.link_attendee_to_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if new.user_id is null then
    select u.id into v_user_id
    from auth.users u
    where u.email::citext = new.email
      and not exists (select 1 from public.attendees a where a.user_id = u.id)
    limit 1;
    new.user_id := v_user_id;
  end if;
  return new;
end;
$$;

revoke execute on function public.link_attendee_to_account() from anon, authenticated, public;

create trigger attendees_link_account
  before insert on public.attendees
  for each row execute function public.link_attendee_to_account();

-- Once, for rows already waiting: an account that holds no registration
-- takes its confirmed registration for the soonest event, as above.
with pick as (
  select distinct on (u.id) u.id as user_id, a.id as attendee_id
  from auth.users u
  join public.attendees a on a.email = u.email::citext and a.user_id is null
  join public.events e on e.id = a.event_id
  where not exists (select 1 from public.attendees held where held.user_id = u.id)
  order by u.id, (a.registration_status = 'confirmed') desc, e.start_date, a.created_at
)
update public.attendees a
set user_id = pick.user_id
from pick
where a.id = pick.attendee_id;

-- ---------------------------------------------------------------------------
-- 4. A profile for every existing account
-- ---------------------------------------------------------------------------
-- Accounts from before this migration signed in by email link, so most have
-- no metadata: their name, photo, company and role come from their
-- registration.
insert into public.profiles (id, email, first_name, last_name, phone, photo_url, company, role)
select
  u.id,
  u.email,
  coalesce(nullif(btrim(u.raw_user_meta_data ->> 'first_name'), ''), substring(btrim(a.name) from '^\S+')),
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'last_name'), ''),
    nullif(regexp_replace(btrim(a.name), '^\S+\s*', ''), '')
  ),
  nullif(btrim(u.raw_user_meta_data ->> 'phone'), ''),
  a.photo_url,
  a.company,
  a.role
from auth.users u
left join public.attendees a on a.user_id = u.id
where u.email is not null
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Event information, readable by any signed-in account
-- ---------------------------------------------------------------------------
-- Additional permissive policies: Postgres ORs them with the attendee-scoped
-- ones, which stay for now. Unpublished sessions stay hidden.
create policy "events readable to signed-in accounts" on public.events
  for select to authenticated using (true);

create policy "speakers readable to signed-in accounts" on public.speakers
  for select to authenticated using (true);

create policy "sessions readable to signed-in accounts" on public.sessions
  for select to authenticated using (is_published);

create policy "session_speakers readable to signed-in accounts" on public.session_speakers
  for select to authenticated using (true);

create policy "partners readable to signed-in accounts" on public.partners
  for select to authenticated using (true);

create policy "podcast readable to signed-in accounts" on public.podcast_episodes
  for select to authenticated using (true);

create policy "faqs readable to signed-in accounts" on public.faqs
  for select to authenticated using (true);
