# Sprint 4 — Push notifications, check-in & auction

**Goal:** the "magic" layer: the right notification at the right moment
(never more than 4/day), three ways to check in, and a charity auction that
is race-safe and updates live on every phone.

**Duration:** ~2 weeks · **Requires:** Sprints 1–3 done
**Spec DoD covered:** §10.6 (session-starting push), plus auction + check-in features

---

## Context for the agent

Read first: `supabase/functions/send-push/`, `lib/push.ts`,
`app/auction.tsx`, `supabase/functions/check-in/`, spec §3 (push categories,
the 4/day cap, check-in modes), `notifications` + `notification_recipients` +
`auction_items` + `bids` tables in the schema.

## Prerequisites

- [ ] APNs key uploaded to EAS (Apple Developer account — Kylie's org)
- [ ] `EXPO_ACCESS_TOKEN` in function secrets
- [ ] Decision from REGROWTH: who writes notification copy (templates below need sign-off)
- [ ] Venue lat/lng + geofence radius confirmed on the `events` row

## Tasks

### 1. Push infrastructure, verified

- End-to-end token flow: `registerForPush` stores token → `send-push` delivers
  → tapping the notification deep-links to the right screen
  (`data.route` convention; wire `expo-notifications` response listener in
  `app/_layout.tsx`).
- Token hygiene: handle Expo receipts — prune `DeviceNotRegistered` tokens.
- Fix the N+1: replace per-attendee daily-cap count queries with one grouped
  query over `notification_recipients` for the day.
- Unit-test the eligibility logic (cap, category opt-out, admin bypass) —
  extract it to a pure function; add Deno tests runnable in CI.

**Acceptance:** admin-composed push arrives on a physical device and
deep-links correctly; opted-out categories are skipped; the 5th
non-admin push of a day is dropped.

### 2. Scheduled notification jobs (pg_cron sweeps)

1. **Session starting** — every 5 min: sessions starting in 15±2.5 min →
   attendees with the session in `schedule_picks` ∪ followed-speaker sessions.
2. **Don't miss this** — concurrent-session window approaching and the
   attendee picked none of them → one nudge.
3. **People to meet** — daily 08:30, one suggested attendee from
   `daily_suggestions`.
4. **Partner spotlight** — admin-scheduled only, enforce ≤ 2/day globally.
5. All jobs insert a `notifications` row and invoke `send-push` — one
   pipeline, one cap enforcement point. Priority ranking when over cap:
   admin > session_starting > auction > dont_miss > people_to_meet >
   partner_spotlight (drop lowest).

**Acceptance:** with a test schedule, a picked session triggers a push at
T-15 (§10.6 ✅); cap + ranking verified by forcing 6 queued notifications.

### 3. Check-in, three ways

- **Self:** the Home "I'm here" button currently does nothing — wire it to
  the `check-in` function (JWT-derived attendee, same security pattern as
  Sprint 3 fixes).
- **Staff QR:** admin panel scanner page — staff scans an attendee's QR →
  check-in with `source: staff_qr`.
- **Geofence prompt:** on app foreground, if within `geofence_radius_m` of
  venue and not checked in today → prompt. (Skip Bluetooth beacons for v1 —
  document as a stretch.)
- Check-in should be per-day for a multi-day event: change `checked_in_at`
  usage to a `check_ins` table (attendee_id, day, source, created_at) via
  migration; keep `checked_in_at` as "first ever" for dashboard compat.

**Acceptance:** all three paths produce check-in rows; dashboard count moves.

### 4. Auction made safe & live

- **Migration:** `place_bid(item_id, amount)` RPC — row-locks the item,
  validates `is_open`, `now() < ends_at`, `amount >= current + min_increment`,
  inserts the bid, updates `current_bid`/`current_bidder_id` atomically,
  returns the previous bidder for outbid notification. Client switches from
  raw `bids` insert to this RPC. Revoke direct insert on `bids` from
  authenticated role.
- **Outbid push:** previous bidder gets an `auction` category push
  ("someone's topped your bid on …").
- **Close-out:** admin closes item → `winner_id` set → "you won" push +
  payment-instructions screen (static copy; payment itself is out of scope
  per spec §9).
- Bid history list on item detail; realtime already subscribes — verify
  sub-second propagation across two devices.

**Acceptance:** two devices bidding simultaneously never produce an invalid
state (test with rapid alternating bids); outbid + winner pushes arrive.

### 5. Admin push composer

- Compose title/body, pick category, target (all / segment by
  interests/check-in status / individuals), send now or schedule.
- Preview enforcing brand voice hints; character counts for lock-screen
  truncation.

## Out of scope

Bluetooth/beacon check-in, payment processing, notification analytics
dashboards (Sprint 5 reports), Android-specific push polish.

## Definition of Done

- [ ] §10.6 passes: followed/picked session → push at T-15 on a real device
- [ ] 4/day cap + priority ranking enforced and unit-tested in CI
- [ ] Three check-in paths live; per-day check-in model migrated
- [ ] `place_bid` RPC atomic under concurrent load; direct `bids` insert revoked
- [ ] Outbid and winner notifications delivered
- [ ] Admin push composer shipped with audience targeting
- [ ] `docs/ROADMAP.md` updated
