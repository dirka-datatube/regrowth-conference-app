-- Sprint 4: per-day check-ins + race-safe auction bidding.

-- Multi-day event => check-in is per day. attendees.checked_in_at remains
-- as "first ever checked in" for dashboard compatibility.
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid not null references attendees(id) on delete cascade,
  day date not null default ((now() at time zone 'Australia/Perth')::date),
  source text not null default 'self' check (source in ('self', 'staff_qr', 'geofence')),
  created_at timestamptz not null default now(),
  unique (attendee_id, day)
);

alter table check_ins enable row level security;

create policy "check ins self read" on check_ins
  for select using (
    attendee_id = current_attendee_id()
    or exists (
      select 1 from attendees a
      where a.id = check_ins.attendee_id and is_admin_for(a.event_id)
    )
  );

-- Atomic, validated bidding. Replaces direct inserts on bids.
create or replace function place_bid(p_item_id uuid, p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attendee_id uuid := current_attendee_id();
  v_item auction_items%rowtype;
  v_prev_bidder uuid;
  v_min numeric;
begin
  if v_attendee_id is null then
    raise exception 'NOT_AN_ATTENDEE';
  end if;

  select * into v_item from auction_items where id = p_item_id for update;
  if not found then
    raise exception 'ITEM_NOT_FOUND';
  end if;
  if not v_item.is_open or now() >= v_item.ends_at then
    raise exception 'AUCTION_CLOSED';
  end if;

  v_min := coalesce(v_item.current_bid, v_item.starting_bid - 1) + 1;
  if p_amount < v_min then
    raise exception 'BID_TOO_LOW minimum=%', v_min;
  end if;

  v_prev_bidder := v_item.current_bidder_id;

  insert into bids (item_id, attendee_id, amount)
  values (p_item_id, v_attendee_id, p_amount);

  update auction_items
  set current_bid = p_amount, current_bidder_id = v_attendee_id
  where id = p_item_id;

  -- Queue the outbid push; the process_queue cron sweep delivers it.
  if v_prev_bidder is not null and v_prev_bidder <> v_attendee_id then
    insert into notifications (event_id, type, title, body, data, target_segment, scheduled_at)
    values (
      v_item.event_id,
      'auction',
      'You''ve been outbid',
      format('Someone topped your bid on %s. Jump back in before it closes.', v_item.name),
      jsonb_build_object('route', '/auction', 'item_id', p_item_id),
      jsonb_build_object('attendee_ids', jsonb_build_array(v_prev_bidder)),
      now()
    );
  end if;

  return jsonb_build_object('ok', true, 'current_bid', p_amount);
end;
$$;

revoke execute on function place_bid(uuid, numeric) from anon, public;
grant execute on function place_bid(uuid, numeric) to authenticated;

-- All bids now flow through place_bid.
drop policy "bids insert self" on bids;
