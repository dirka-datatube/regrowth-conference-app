-- Fixes for security advisor findings (2026-07-17 run):
--  * pin search_path on all public functions
--  * trigger functions must not be RPC-callable
--  * RLS helpers: executable by authenticated (policies need them), not anon
--  * public buckets are served by URL; drop list-everything SELECT policies
-- Accepted for now (documented in docs/ROADMAP.md): citext extension lives
-- in the public schema.

alter function public.bump_question_upvotes() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.current_attendee_id() set search_path = public;
alter function public.current_attendee_event_id() set search_path = public;
alter function public.is_admin_for(uuid) set search_path = public;

revoke execute on function public.bump_question_upvotes() from anon, authenticated, public;
revoke execute on function public.handle_new_auth_user() from anon, authenticated, public;
revoke execute on function public.set_updated_at() from anon, authenticated, public;

revoke execute on function public.current_attendee_id() from anon, public;
revoke execute on function public.current_attendee_event_id() from anon, public;
revoke execute on function public.is_admin_for(uuid) from anon, public;

drop policy "public read headshots" on storage.objects;
drop policy "public read partner logos" on storage.objects;
drop policy "public read gallery" on storage.objects;
drop policy "public read auction" on storage.objects;
