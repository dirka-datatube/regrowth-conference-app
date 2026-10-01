-- Registration state (Figma "NEW: Event App" v2 — Sprint 07)
--
-- The v2 design renders every event surface in one of two states: registered
-- or not. Home and Events swap GET STARTED for "You're Registered!" + ACCESS
-- EVENT, Events shows a ticket card, and Connect unlocks the event community.
-- Tickets are tiered: VIP PASS (Navigate), VIP DELEGATE (Study Tour).
--
-- Until Sprint 08 splits the person (`profiles`) from the registration
-- (`registrations`), an `attendees` row IS a registration for its event_id, so
-- the state lives here. `attendees.user_id` is unique, which means one real
-- registration per account until then. The app reads registrations through
-- useRegistrations(), which already returns a list, so Sprint 08 can change the
-- data underneath without touching a screen.
--
-- Every existing row was created from a paid registration (website signup or
-- the ActiveCampaign import), so the status backfills to 'confirmed'. The tier
-- is unknown for those rows and stays null; the app omits the tier pill rather
-- than guessing one.

create type registration_status as enum ('pending', 'confirmed', 'cancelled');

alter table attendees
  add column if not exists ticket_tier text,
  add column if not exists registration_status registration_status not null default 'confirmed';

comment on column attendees.ticket_tier is
  'Ticket tier shown on the badge, e.g. "VIP Pass". Written by the registration webhook (Sprint 09) or the admin panel.';
comment on column attendees.registration_status is
  'Only confirmed registrations unlock an event in the app.';

-- ---------------------------------------------------------------------------
-- Attendees may update their own row ("attendees self update") so they can
-- edit their name, photo, bio and preferences. Which event they are registered
-- for, at what tier, and whether they have been checked in are not theirs to
-- change — before this sprint that did not matter much, but these columns now
-- decide what the app unlocks. RLS cannot restrict columns, so a trigger does.
--
-- The website webhook, the ActiveCampaign sync and check-in all run with the
-- service role; admins write through the admin panel. Neither is affected.
-- ---------------------------------------------------------------------------
create or replace function public.guard_attendee_registration()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Service role, migrations and the dashboard pass straight through.
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new;
  end if;
  if is_admin_for(old.event_id) then
    return new;
  end if;

  if new.event_id is distinct from old.event_id
     or new.user_id is distinct from old.user_id
     or new.email is distinct from old.email
     or new.ac_contact_id is distinct from old.ac_contact_id
     or new.qr_token is distinct from old.qr_token
     or new.checked_in_at is distinct from old.checked_in_at
     or new.ticket_tier is distinct from old.ticket_tier
     or new.registration_status is distinct from old.registration_status
  then
    raise exception 'Registration details are managed by REGROWTH'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Trigger functions must not be RPC-callable (see 20260101000300).
revoke execute on function public.guard_attendee_registration() from anon, authenticated, public;

create trigger attendees_guard_registration
  before update on attendees
  for each row execute function public.guard_attendee_registration();
