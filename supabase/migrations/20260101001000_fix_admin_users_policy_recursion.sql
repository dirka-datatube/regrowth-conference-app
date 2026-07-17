-- Found by the RLS assertion suite: the admin_users self-read policy
-- sub-selected admin_users, recursing infinitely (42P17) for any
-- authenticated select — including the admin panel's own login gate.
-- A security-definer helper checks ownership without re-entering RLS.

create or replace function is_admin_owner() returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users where user_id = auth.uid() and role = 'owner'
  );
$$;

revoke execute on function is_admin_owner() from anon, public;
grant execute on function is_admin_owner() to authenticated;

drop policy "admin users self read" on admin_users;
create policy "admin users self read" on admin_users
  for select using (user_id = auth.uid() or is_admin_owner());
