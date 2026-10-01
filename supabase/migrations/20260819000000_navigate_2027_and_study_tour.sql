-- Two products, and v1 targets Navigate 2027.
--
-- Confirmed 2026-08-19. The Figma file tags everything "Navigate 2027" while
-- the live project was seeded with "REGROWTH Annual Conference 2026". 2027 is
-- correct: the app goes live in November 2026 and sells into the 2027
-- conference, which is what makes the early-bird pricing in spec v3 mean
-- anything.
--
-- Spec v3 naming, applied here:
--   • the conference  -> "Navigate"
--   • the study tour  -> "REGROWTH Study Tour"
--
-- `seed.sql` uses `on conflict (id) do nothing`, so re-seeding will never
-- correct an existing row — hence this migration.

-- Rename the conference. Guarded on the old seeded name so this cannot clobber
-- content the admin panel has since written.
update events
set name = 'Navigate 2027',
    start_date = '2027-08-11',
    end_date = '2027-08-13',
    updated_at = now()
where id = '00000000-0000-0000-0000-000000000001'
  and name = 'REGROWTH Annual Conference 2026';

-- The Study Tour is the second product. It needs to exist as a real row before
-- anything can be scoped per-product: the Events carousel lists both, and notes
-- tag against events.id.
--
-- Dates and venue are fixtures — the admin panel owns the real ones.
insert into events (id, name, start_date, end_date, venue, venue_lat, venue_lng)
values (
  '00000000-0000-0000-0000-000000000002',
  'REGROWTH Study Tour 2027',
  '2027-06-02',
  '2027-06-09',
  'Melbourne',
  -37.8136,
  144.9631
)
on conflict (id) do nothing;
