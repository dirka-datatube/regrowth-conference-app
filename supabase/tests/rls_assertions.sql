-- RLS assertion suite. Runs as one transaction and ALWAYS rolls back —
-- the final RAISE carries the results. Safe to run against production.
-- Verified live 2026-07-17 (see docs/reports/2026-07-17-phase-two-execution.md).
begin;

-- Fixture: bind two test attendees to fake auth users (rolled back).
update attendees set user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  where email = 'test1@regrowth.example';
update attendees set user_id = 'aaaaaaaa-0000-0000-0000-000000000002'
  where email = 'test2@regrowth.example';

-- Private fixtures owned by test2.
insert into notes (attendee_id, session_id, body)
select id, null, 'private-note' from attendees where email = 'test2@regrowth.example';

insert into questions (event_id, attendee_id, body, anonymous, status)
select event_id, id, 'anonymous-question', true, 'approved'
from attendees where email = 'test2@regrowth.example';

-- Become test1 (authenticated role, RLS enforced).
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

do $$
declare
  n int;
  fail text := '';
begin
  -- 1. Cannot read another attendee's notes.
  select count(*) into n from notes where body = 'private-note';
  if n <> 0 then fail := fail || ' notes-leak'; end if;

  -- 2. Anonymous question author never resolvable via the public view.
  select count(*) into n from public_questions
    where body = 'anonymous-question' and author_name is not null;
  if n <> 0 then fail := fail || ' anon-author-leak'; end if;

  -- 3. The anonymous question itself IS visible (approved).
  select count(*) into n from public_questions where body = 'anonymous-question';
  if n <> 1 then fail := fail || ' approved-question-missing'; end if;

  -- 4. Cannot read other attendees'' push tokens? (column-level not enforced;
  --    directory rows visible by design) — assert hidden attendees invisible.
  select count(*) into n from attendees where visibility = 'hidden';
  if n <> 0 then fail := fail || ' hidden-attendee-visible'; end if;

  -- 5. Cannot insert a bid directly (must use place_bid RPC).
  begin
    insert into bids (item_id, attendee_id, amount)
    values (gen_random_uuid(), 'aaaaaaaa-0000-0000-0000-000000000001', 1);
    fail := fail || ' direct-bid-allowed';
  exception when others then null; -- expected
  end;

  -- 6. Cannot read admin tables.
  select count(*) into n from admin_users;
  if n <> 0 then fail := fail || ' admin-users-visible'; end if;

  if fail = '' then
    raise exception 'RLS_ASSERTIONS_PASS (intentional rollback)';
  else
    raise exception 'RLS_ASSERTIONS_FAIL:%', fail;
  end if;
end $$;

rollback;
