-- REGROWTH Conference App — initial schema
-- Single Supabase project shared by the iOS app + Lovable admin panel.
-- One event at a time (multi-event is explicitly out of scope for v1).

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type attendee_visibility as enum ('public', 'connections_only', 'hidden');
create type session_type as enum ('keynote', 'panel', 'workshop', 'breakout', 'meal', 'social', 'admin');
create type question_status as enum ('pending', 'approved', 'rejected', 'answered');
create type connection_source as enum ('qr_scan', 'business_card', 'manual', 'suggested');
create type notification_type as enum (
  'session_starting',
  'dont_miss',
  'people_to_meet',
  'partner_spotlight',
  'auction',
  'admin_announcement'
);
create type admin_role as enum ('owner', 'editor', 'moderator', 'viewer');

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  venue text,
  venue_lat double precision,
  venue_lng double precision,
  geofence_radius_m integer default 250,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Attendees
-- ---------------------------------------------------------------------------
create table attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  ac_contact_id text unique,
  email citext not null,
  name text not null,
  company text,
  role text,
  photo_url text,
  bio text,
  interests text[] not null default '{}',
  visibility attendee_visibility not null default 'public',
  dietary text,
  qr_token text not null default encode(gen_random_bytes(16), 'hex'),
  push_token text,
  notification_prefs jsonb not null default jsonb_build_object(
    'session_starting', true,
    'dont_miss', true,
    'people_to_meet', true,
    'partner_spotlight', true,
    'auction', true
  ),
  checked_in_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);

create index attendees_event_idx on attendees(event_id);
create index attendees_user_idx on attendees(user_id);
create index attendees_qr_idx on attendees(qr_token);

-- ---------------------------------------------------------------------------
-- Speakers
-- ---------------------------------------------------------------------------
create table speakers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  title text,
  company text,
  bio text,
  headshot_url text,
  linkedin_url text,
  tags text[] not null default '{}',
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index speakers_event_idx on speakers(event_id);

create table speaker_followers (
  speaker_id uuid not null references speakers(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (speaker_id, attendee_id)
);

-- ---------------------------------------------------------------------------
-- Sessions / agenda
-- ---------------------------------------------------------------------------
create table sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  abstract text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  room text,
  type session_type not null default 'breakout',
  tags text[] not null default '{}',
  capacity integer,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index sessions_event_time_idx on sessions(event_id, start_at);

create table session_speakers (
  session_id uuid not null references sessions(id) on delete cascade,
  speaker_id uuid not null references speakers(id) on delete cascade,
  primary key (session_id, speaker_id)
);

create table schedule_picks (
  attendee_id uuid not null references attendees(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (attendee_id, session_id)
);

create index schedule_picks_session_idx on schedule_picks(session_id);

-- ---------------------------------------------------------------------------
-- Partners
-- ---------------------------------------------------------------------------
create table partners (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  logo_url text,
  description text,
  solutions_content text,
  tags text[] not null default '{}',
  contact_email citext,
  website_url text,
  display_order integer default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index partners_event_idx on partners(event_id);

create table partner_interest (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references attendees(id) on delete cascade,
  partner_id uuid not null references partners(id) on delete cascade,
  ac_event_emitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (attendee_id, partner_id)
);

-- ---------------------------------------------------------------------------
-- Connections
-- ---------------------------------------------------------------------------
create table connections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  attendee_a uuid not null references attendees(id) on delete cascade,
  attendee_b uuid not null references attendees(id) on delete cascade,
  source connection_source not null default 'qr_scan',
  note text,
  created_at timestamptz not null default now(),
  check (attendee_a <> attendee_b)
);

-- Symmetrical uniqueness — store the smaller uuid first to enforce A<>B uniqueness.
create unique index connections_pair_idx
  on connections(event_id, least(attendee_a, attendee_b), greatest(attendee_a, attendee_b));
create index connections_a_idx on connections(attendee_a);
create index connections_b_idx on connections(attendee_b);

create table pending_connections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  initiator_id uuid not null references attendees(id) on delete cascade,
  captured_name text,
  captured_email citext,
  captured_company text,
  captured_phone text,
  card_image_url text,
  resolved_attendee_id uuid references attendees(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
create table notes (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references attendees(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  body text not null default '',
  ai_summary text,
  ai_summary_generated_at timestamptz,
  follow_up_questions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_attendee_idx on notes(attendee_id);
create index notes_session_idx on notes(session_id);

-- ---------------------------------------------------------------------------
-- Q&A
-- ---------------------------------------------------------------------------
create table questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  speaker_id uuid references speakers(id) on delete set null,
  attendee_id uuid not null references attendees(id) on delete cascade,
  body text not null,
  anonymous boolean not null default false,
  status question_status not null default 'pending',
  upvotes integer not null default 0,
  answered_at timestamptz,
  moderation_note text,
  created_at timestamptz not null default now()
);

create index questions_event_idx on questions(event_id);
create index questions_session_idx on questions(session_id);
create index questions_speaker_idx on questions(speaker_id);

create table question_upvotes (
  question_id uuid not null references questions(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, attendee_id)
);

-- Keep questions.upvotes denormalised for fast sort.
create or replace function bump_question_upvotes() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update questions set upvotes = upvotes + 1 where id = new.question_id;
    return new;
  elsif tg_op = 'DELETE' then
    update questions set upvotes = greatest(upvotes - 1, 0) where id = old.question_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger question_upvotes_count
  after insert or delete on question_upvotes
  for each row execute function bump_question_upvotes();

-- ---------------------------------------------------------------------------
-- Auction
-- ---------------------------------------------------------------------------
create table auction_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  description text,
  photo_url text,
  starting_bid numeric(10, 2) not null,
  current_bid numeric(10, 2),
  current_bidder_id uuid references attendees(id),
  ends_at timestamptz not null,
  is_open boolean not null default true,
  winner_id uuid references attendees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index auction_items_event_idx on auction_items(event_id);

create table bids (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references auction_items(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index bids_item_idx on bids(item_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  target_segment jsonb not null default '{}'::jsonb, -- e.g. {"all": true} or {"attendee_ids": [...]}
  scheduled_at timestamptz,
  sent_at timestamptz,
  sent_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index notifications_event_idx on notifications(event_id);
create index notifications_scheduled_idx on notifications(scheduled_at) where sent_at is null;

create table notification_recipients (
  notification_id uuid not null references notifications(id) on delete cascade,
  attendee_id uuid not null references attendees(id) on delete cascade,
  delivered_at timestamptz,
  opened_at timestamptz,
  primary key (notification_id, attendee_id)
);

-- ---------------------------------------------------------------------------
-- Gallery
-- ---------------------------------------------------------------------------
create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  url text not null,
  caption text,
  taken_by uuid references attendees(id) on delete set null,
  taken_at timestamptz,
  is_official boolean not null default false,
  created_at timestamptz not null default now()
);

create index gallery_event_idx on gallery_items(event_id, taken_at desc);

-- ---------------------------------------------------------------------------
-- FAQs / podcast
-- ---------------------------------------------------------------------------
create table faqs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  question text not null,
  answer text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  description text,
  audio_url text not null,
  episode_url text,
  duration_seconds integer,
  published_at timestamptz not null
);

-- ---------------------------------------------------------------------------
-- Suggestions cache (people-to-meet / partners)
-- ---------------------------------------------------------------------------
create table daily_suggestions (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references attendees(id) on delete cascade,
  for_date date not null,
  suggested_attendee_ids uuid[] not null default '{}',
  suggested_partner_ids uuid[] not null default '{}',
  rationale jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (attendee_id, for_date)
);

-- ---------------------------------------------------------------------------
-- Admin / audit
-- ---------------------------------------------------------------------------
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email citext not null unique,
  role admin_role not null default 'editor',
  event_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references admin_users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'events','attendees','speakers','sessions','partners',
    'notes','auction_items'
  ]) loop
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end$$;

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS
-- ---------------------------------------------------------------------------
create or replace function current_attendee_id() returns uuid
language sql stable security definer
as $$
  select id from attendees where user_id = auth.uid() limit 1;
$$;

create or replace function current_attendee_event_id() returns uuid
language sql stable security definer
as $$
  select event_id from attendees where user_id = auth.uid() limit 1;
$$;

create or replace function is_admin_for(p_event_id uuid) returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from admin_users
    where user_id = auth.uid()
      and (role = 'owner' or p_event_id = any(event_ids))
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS — enable on every table
-- ---------------------------------------------------------------------------
alter table events enable row level security;
alter table attendees enable row level security;
alter table speakers enable row level security;
alter table speaker_followers enable row level security;
alter table sessions enable row level security;
alter table session_speakers enable row level security;
alter table schedule_picks enable row level security;
alter table partners enable row level security;
alter table partner_interest enable row level security;
alter table connections enable row level security;
alter table pending_connections enable row level security;
alter table notes enable row level security;
alter table questions enable row level security;
alter table question_upvotes enable row level security;
alter table auction_items enable row level security;
alter table bids enable row level security;
alter table notifications enable row level security;
alter table notification_recipients enable row level security;
alter table gallery_items enable row level security;
alter table faqs enable row level security;
alter table podcast_episodes enable row level security;
alter table daily_suggestions enable row level security;
alter table admin_users enable row level security;
alter table audit_log enable row level security;

-- Public-ish read tables: any authenticated attendee in the same event can read.
create policy "events readable to attendee" on events
  for select using (id = current_attendee_event_id() or is_admin_for(id));

create policy "speakers readable to attendees" on speakers
  for select using (event_id = current_attendee_event_id() or is_admin_for(event_id));

create policy "sessions readable to attendees" on sessions
  for select using (
    is_published and (event_id = current_attendee_event_id() or is_admin_for(event_id))
  );

create policy "session_speakers readable to attendees" on session_speakers
  for select using (
    exists (
      select 1 from sessions s
      where s.id = session_speakers.session_id
        and (s.event_id = current_attendee_event_id() or is_admin_for(s.event_id))
    )
  );

create policy "partners readable to attendees" on partners
  for select using (event_id = current_attendee_event_id() or is_admin_for(event_id));

create policy "faqs readable to attendees" on faqs
  for select using (event_id = current_attendee_event_id() or is_admin_for(event_id));

create policy "podcast readable to attendees" on podcast_episodes
  for select using (event_id = current_attendee_event_id() or is_admin_for(event_id));

create policy "gallery readable to attendees" on gallery_items
  for select using (event_id = current_attendee_event_id() or is_admin_for(event_id));

create policy "auction items readable to attendees" on auction_items
  for select using (event_id = current_attendee_event_id() or is_admin_for(event_id));

create policy "bids readable to bidders+admin" on bids
  for select using (
    attendee_id = current_attendee_id()
    or exists (
      select 1 from auction_items ai
      where ai.id = bids.item_id and is_admin_for(ai.event_id)
    )
  );

-- Attendees: respect visibility. "public" + "connections_only" both visible to
-- the directory; clients should hide email/phone unless connected. "hidden"
-- is only visible to the attendee themselves.
create policy "attendees self read" on attendees
  for select using (id = current_attendee_id() or is_admin_for(event_id) or
    (event_id = current_attendee_event_id() and visibility <> 'hidden')
  );

create policy "attendees self update" on attendees
  for update using (id = current_attendee_id())
  with check (id = current_attendee_id());

-- Schedule picks (private to attendee).
create policy "schedule picks self" on schedule_picks
  for all using (attendee_id = current_attendee_id())
  with check (attendee_id = current_attendee_id());

create policy "speaker followers self" on speaker_followers
  for all using (attendee_id = current_attendee_id())
  with check (attendee_id = current_attendee_id());

-- Notes — private.
create policy "notes self" on notes
  for all using (attendee_id = current_attendee_id())
  with check (attendee_id = current_attendee_id());

-- Connections — visible if user is a or b, or admin.
create policy "connections self" on connections
  for select using (
    attendee_a = current_attendee_id()
    or attendee_b = current_attendee_id()
    or is_admin_for(event_id)
  );

create policy "connections insert" on connections
  for insert with check (
    (attendee_a = current_attendee_id() or attendee_b = current_attendee_id())
    and event_id = current_attendee_event_id()
  );

create policy "pending connections self" on pending_connections
  for all using (initiator_id = current_attendee_id())
  with check (initiator_id = current_attendee_id());

-- Partner interest — attendee can create their own; admins see all.
create policy "partner interest self" on partner_interest
  for select using (attendee_id = current_attendee_id() or exists (
    select 1 from partners p where p.id = partner_interest.partner_id and is_admin_for(p.event_id)
  ));

create policy "partner interest insert" on partner_interest
  for insert with check (attendee_id = current_attendee_id());

-- Q&A — read approved + own. Insert as self. Upvotes as self.
create policy "questions read" on questions
  for select using (
    (status = 'approved' and event_id = current_attendee_event_id())
    or attendee_id = current_attendee_id()
    or is_admin_for(event_id)
  );

create policy "questions insert self" on questions
  for insert with check (
    attendee_id = current_attendee_id() and event_id = current_attendee_event_id()
  );

create policy "question upvotes self" on question_upvotes
  for all using (attendee_id = current_attendee_id())
  with check (attendee_id = current_attendee_id());

-- Bids — insert as self.
create policy "bids insert self" on bids
  for insert with check (attendee_id = current_attendee_id());

-- Notifications — recipients can read their own delivery rows.
create policy "notif recipients self" on notification_recipients
  for select using (attendee_id = current_attendee_id());

create policy "notifications read history" on notifications
  for select using (
    event_id = current_attendee_event_id()
    and sent_at is not null
    and exists (
      select 1 from notification_recipients nr
      where nr.notification_id = notifications.id and nr.attendee_id = current_attendee_id()
    )
  );

-- Suggestions — strictly self.
create policy "suggestions self" on daily_suggestions
  for select using (attendee_id = current_attendee_id());

-- Admin tables — only admins.
create policy "admin users self read" on admin_users
  for select using (user_id = auth.uid() or exists (
    select 1 from admin_users a where a.user_id = auth.uid() and a.role = 'owner'
  ));

create policy "audit log admins" on audit_log
  for select using (exists (
    select 1 from admin_users a where a.user_id = auth.uid()
  ));

-- Admin write policies (every table, owner+editor)
create policy "events admin write" on events
  for all using (is_admin_for(id)) with check (is_admin_for(id));

create policy "attendees admin write" on attendees
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "speakers admin write" on speakers
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "sessions admin write" on sessions
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "session_speakers admin write" on session_speakers
  for all using (exists (
    select 1 from sessions s where s.id = session_speakers.session_id and is_admin_for(s.event_id)
  )) with check (exists (
    select 1 from sessions s where s.id = session_speakers.session_id and is_admin_for(s.event_id)
  ));

create policy "partners admin write" on partners
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "auction items admin write" on auction_items
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "notifications admin write" on notifications
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "gallery admin write" on gallery_items
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "faqs admin write" on faqs
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "podcast admin write" on podcast_episodes
  for all using (is_admin_for(event_id)) with check (is_admin_for(event_id));

create policy "questions admin moderate" on questions
  for update using (is_admin_for(event_id)) with check (is_admin_for(event_id));

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table questions;
alter publication supabase_realtime add table question_upvotes;
alter publication supabase_realtime add table auction_items;
alter publication supabase_realtime add table bids;
alter publication supabase_realtime add table notifications;
