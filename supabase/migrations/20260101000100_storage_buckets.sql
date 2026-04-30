-- Storage buckets used by the iOS app + admin panel.
-- Logos / headshots / gallery: public read, admin write.
-- Business cards: private (only the uploader can read).

insert into storage.buckets (id, name, public)
values
  ('headshots', 'headshots', true),
  ('partner-logos', 'partner-logos', true),
  ('gallery', 'gallery', true),
  ('auction', 'auction', true),
  ('business-cards', 'business-cards', false)
on conflict (id) do nothing;

-- Public read policies on the public buckets.
create policy "public read headshots"
  on storage.objects for select
  using (bucket_id = 'headshots');

create policy "public read partner logos"
  on storage.objects for select
  using (bucket_id = 'partner-logos');

create policy "public read gallery"
  on storage.objects for select
  using (bucket_id = 'gallery');

create policy "public read auction"
  on storage.objects for select
  using (bucket_id = 'auction');

-- Attendees can upload their own headshot (folder = their attendee id).
create policy "attendee upload own headshot"
  on storage.objects for insert
  with check (
    bucket_id = 'headshots'
    and (storage.foldername(name))[1] = current_attendee_id()::text
  );

-- Attendees can upload to gallery + business-cards (private).
create policy "attendee upload gallery"
  on storage.objects for insert
  with check (
    bucket_id = 'gallery'
    and auth.role() = 'authenticated'
  );

create policy "attendee upload business cards"
  on storage.objects for insert
  with check (
    bucket_id = 'business-cards'
    and (storage.foldername(name))[1] = current_attendee_id()::text
  );

create policy "attendee read own business cards"
  on storage.objects for select
  using (
    bucket_id = 'business-cards'
    and (storage.foldername(name))[1] = current_attendee_id()::text
  );
