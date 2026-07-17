# Sprint 2 — Admin panel & content pipeline

**Goal:** Kylie's team can load and edit all conference content themselves,
and it appears on an attendee's phone within 30 seconds. Attendee data flows
in from ActiveCampaign automatically.

**Duration:** ~2 weeks · **Requires:** Sprint 1 done
**Spec DoD covered:** §10.2 (personalised home), §10.7 (admin publish → phone < 30 s)


> **Progress 2026-07-17:** Executed in the autonomous sprint run — see
> [`docs/reports/2026-07-17-sprint-execution.md`](../reports/2026-07-17-sprint-execution.md)
> for what shipped, verification evidence, and the remaining device/human-bound
> items for this sprint.

---

## Context for the agent

Two workstreams: (A) the **admin panel**, a separate Lovable/Next.js project
against the *same* Supabase instance (new repo — this repo only carries its
contract: schema, RLS, and this brief); (B) **data pipelines** in this repo
(AC sync scheduling, realtime verification, suggestions).

Read first: spec §4 (admin features), `supabase/migrations/*` (admin_users,
`is_admin_for()`), `supabase/functions/ac-sync-attendees/`,
`supabase/functions/claude-suggestions/`, `lib/hooks/useSuggestions.ts`.

## Prerequisites

- [ ] ActiveCampaign API URL + key + the list ID(s) for conference attendees
- [ ] Decision: which staff emails get admin access, and at what role
- [ ] Final(ish) agenda content from REGROWTH — even a draft — for real-data testing

## Tasks

### 1. Admin panel MVP (Lovable / Next.js — separate repo)

Build in priority order; auth via Supabase (email+password or magic link) with
`admin_users` gating:

1. **Agenda manager** — sessions CRUD, speaker assignment, room/time conflict
   warning (client-side overlap check), publish/unpublish toggle.
2. **Speakers** — CRUD with headshot upload to the `headshots` bucket,
   LinkedIn URL validation.
3. **Partners** — CRUD with logo upload, tags, `solutions_content`,
   featured flag.
4. **Attendees** — list/search, edit, visibility toggle, CSV import
   (name,email,company,role,interests,dietary), manual add.
5. **FAQs + podcast episodes** — simple CRUD.
6. **Dashboard** — counts: attendees, checked-in, sessions today, questions
   pending. (Read queries only; fancy analytics is Sprint 5.)

Admin writes go through RLS as an authenticated admin (policies already
exist: `is_admin_for(event_id)`), *not* the service-role key, except CSV
import which may use a server route with the service key. Every mutation
inserts an `audit_log` row.

**Acceptance:** a non-technical user can create a session with a speaker and
see it in the iOS app. Conflict warning fires for overlapping same-room
sessions.

### 2. Realtime content propagation (< 30 s requirement)

The app currently relies on React Query stale times (5 min) — that fails the
30-second spec. Add a realtime subscription on `sessions` (already in the
publication) that invalidates the `['sessions']` query key on any change.
Same for `speakers` and `partners` if effort allows.

**Acceptance:** editing a session title in the admin updates an open Agenda
tab on a device in < 30 s without manual refresh.

### 3. ActiveCampaign sync, scheduled

- Enable `pg_cron` + `pg_net`; schedule `ac-sync-attendees` every 15 min.
- Verify the upsert doesn't clobber `user_id`, `qr_token`,
  `notification_prefs`, or app-edited fields (interests/bio): sync only
  AC-owned columns (email, name, company, ac_contact_id).
- Wire `website-signup` webhook into the real website form (coordinate with
  whoever owns the site; document the URL + secret handshake in
  `docs/integrations/activecampaign.md` — create it).
- Log each sync run's counts somewhere queryable (a `sync_runs` table or
  function logs) so failures are visible.

**Acceptance:** a new contact added to the AC list appears in `attendees`
within 15 min; re-running sync twice is idempotent.

### 4. Daily suggestions pipeline

- Schedule `claude-suggestions` daily at 06:00 event-local for all checked-in
  (or all) attendees, batched — don't call it lazily-per-user only.
- Keep the lazy client fallback in `useSuggestions.ts` for cache misses.
- Guard: suggestion prompt must exclude `visibility = 'hidden'` attendees
  (already does — verify) and respect a max token budget.

**Acceptance:** Home shows 3 people + 2 partners with rationale lines for a
test attendee with interests set, without the client triggering generation.

### 5. Real content load + offline pass

- Load the draft agenda, speakers, partners via the admin.
- Verify offline behaviour: airplane mode after first load → Agenda,
  Speakers, Partners, FAQs still render from cache.

## Out of scope

Push composer & Q&A moderation UI (Sprint 4 / 3), auction manager (Sprint 4),
reports (Sprint 5), AC event emission testing beyond deploy (Sprint 3 uses it).

## Definition of Done

- [ ] Admin panel deployed (Vercel), gated by `admin_users`, audit-logged
- [ ] Session/speaker/partner/attendee/FAQ CRUD all functional
- [ ] Admin edit visible on device < 30 s (spec §10.7) — video/screen recording attached to PR
- [ ] AC sync scheduled, idempotent, non-clobbering; integration doc written
- [ ] Suggestions generated on schedule; Home personalised for test users (spec §10.2)
- [ ] Offline read-path verified
- [ ] `docs/ROADMAP.md` updated
