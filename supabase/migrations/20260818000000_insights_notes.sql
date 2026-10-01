-- Insights screen (Figma "NEW: Event App", Insights Screen 80:1892)
--
-- The design promotes notes from a session-bound scratchpad to a first-class
-- "Insights" library: each card carries a title, an event tag ("Navigate 2027"
-- / "Study Tour"), an Important flag, a Reminder, and a pin. None of those
-- existed on `notes`, which only had body + ai_summary + session_id.
--
-- Notes also need to stand alone: you can capture a thought that isn't tied to
-- any session, so the event tag hangs off the note directly rather than being
-- derived through sessions.
--
-- RLS: the existing "notes self" policy is attendee-scoped and continues to
-- cover these columns — no policy change required.

alter table notes
  add column if not exists title text,
  add column if not exists event_id uuid references events(id) on delete set null,
  add column if not exists pinned boolean not null default false,
  add column if not exists important boolean not null default false,
  add column if not exists reminder_at timestamptz;

-- Backfill the event tag for notes that already hang off a session.
update notes n
set event_id = s.event_id
from sessions s
where n.session_id = s.id
  and n.event_id is null;

-- Backfill a title from the session name so existing notes render with a
-- heading rather than an empty card.
update notes n
set title = s.title
from sessions s
where n.session_id = s.id
  and n.title is null;

-- Insights lists newest-first within an event, and filters on pinned.
create index if not exists notes_event_updated_idx
  on notes(attendee_id, event_id, updated_at desc);

create index if not exists notes_pinned_idx
  on notes(attendee_id) where pinned;

-- Reminder sweep: the scheduler looks for due, unsent reminders.
create index if not exists notes_reminder_idx
  on notes(reminder_at) where reminder_at is not null;

comment on column notes.title is 'Card heading shown on the Insights list.';
comment on column notes.event_id is 'Event this note is tagged to (Navigate / Study Tour). Independent of session_id so free-standing notes can still be tagged.';
comment on column notes.pinned is 'Heart on the Insights card; drives the "Pinned" filter.';
comment on column notes.important is 'Important flag shown in the card meta row.';
comment on column notes.reminder_at is 'When set, the attendee is reminded about this note.';
