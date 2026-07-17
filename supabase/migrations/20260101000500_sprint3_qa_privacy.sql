-- Sprint 3: anonymous questions must never leak their author.
-- The app previously joined attendees for every question; this view is the
-- only read path for the public Q&A feed. It masks the author when
-- anonymous and scopes rows to the caller's event.

create view public_questions as
select
  q.id,
  q.event_id,
  q.session_id,
  q.speaker_id,
  q.body,
  q.upvotes,
  q.status,
  q.anonymous,
  q.answered_at,
  q.created_at,
  case when q.anonymous then null else a.name end as author_name
from questions q
left join attendees a on a.id = q.attendee_id
where q.status = 'approved'
  and q.event_id = current_attendee_event_id();

-- View owner is postgres (bypasses RLS on the base tables); exposure is
-- limited by the event scoping + approved-only filter above.
revoke all on public_questions from anon, public;
grant select on public_questions to authenticated;
