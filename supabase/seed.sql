-- Seed data for local dev. Production seeds happen via the admin panel
-- + ActiveCampaign sync.

insert into events (id, name, start_date, end_date, venue, venue_lat, venue_lng)
values (
  '00000000-0000-0000-0000-000000000001',
  'REGROWTH Annual Conference 2026',
  '2026-08-12',
  '2026-08-14',
  'Crown Towers, Perth',
  -31.9614,
  115.8617
)
on conflict (id) do nothing;

insert into speakers (event_id, name, title, company, bio, tags)
values
  ('00000000-0000-0000-0000-000000000001', 'Kylie Walsh', 'Founder', 'REGROWTH', 'Founder of REGROWTH and the host of the Impact & Influence Podcast.', '{"leadership","coaching","keynote"}'),
  ('00000000-0000-0000-0000-000000000001', 'Sample Speaker', 'CEO', 'Acme Realty', 'A long-time agent and coach.', '{"sales","mindset"}')
on conflict do nothing;

insert into partners (event_id, name, description, tags, contact_email, is_featured)
values
  ('00000000-0000-0000-0000-000000000001', 'CommBank', 'Banking partner of REGROWTH.', '{"banking"}', 'partners@cba.example', true),
  ('00000000-0000-0000-0000-000000000001', 'Sample Partner', 'CRM for top performers.', '{"tech","marketing"}', 'hello@sample.example', false)
on conflict do nothing;

insert into faqs (event_id, question, answer, order_index)
values
  ('00000000-0000-0000-0000-000000000001', 'Where is the venue?', 'Crown Towers, Perth.', 1),
  ('00000000-0000-0000-0000-000000000001', 'What is the dress code?', 'Smart casual unless noted otherwise per session.', 2),
  ('00000000-0000-0000-0000-000000000001', 'Will sessions be recorded?', 'Yes — recordings are released to attendees after the conference.', 3)
on conflict do nothing;
