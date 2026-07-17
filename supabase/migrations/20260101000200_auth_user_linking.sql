-- Links new auth.users rows to their attendees / admin_users row by email,
-- and rejects sign-ins for emails we don't know. Registration is owned by
-- the website + ActiveCampaign — the app never creates attendees.
--
-- Client flow: signInWithOtp({ shouldCreateUser: true }). For an unknown
-- email, this trigger raises, user creation aborts, and the client shows
-- "we couldn't find your registration".

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attendee_id uuid;
  v_is_admin boolean;
begin
  select id into v_attendee_id
  from public.attendees
  where email = new.email::citext
  limit 1;

  select exists (
    select 1 from public.admin_users where email = new.email::citext
  ) into v_is_admin;

  if v_attendee_id is null and not v_is_admin then
    raise exception 'REGROWTH_UNREGISTERED_EMAIL';
  end if;

  if v_attendee_id is not null then
    update public.attendees set user_id = new.id where id = v_attendee_id;
  end if;

  if v_is_admin then
    update public.admin_users set user_id = new.id where email = new.email::citext;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
