# Execution report — Sprints 1–5 (2026-07-17)

Autonomous execution run against the live Supabase project **"ReGrowth App"**
(`blcfeguqhnggyxvexggy`, ap-northeast-1). This report is the source of truth
for what is DONE, what is PENDING, and every piece of infrastructure/env
still needed to launch.

---

## 1. What was executed

### Sprint 1 — Live backend & working auth ✅ (code-complete; device pass pending)

- Auth→attendee linking trigger live; **verified at the DB layer both ways**
  (unknown email rejected with `REGROWTH_UNREGISTERED_EMAIL`; known email
  links `user_id`) via a self-rolling-back test transaction.
- Client auth updated (`shouldCreateUser: true`, branded rejection copy).
- Packages: `expo-image-picker` ~15.1.0, deprecated `sentry-expo` →
  `@sentry/react-native` (+ config plugin), `react-native-qrcode-svg` +
  `react-native-svg` added, `@types/node` dev dep.
- **Generated DB types** committed (`types/supabase.ts`); domain aliases in
  `types/database.ts` now derive from them; the supabase client is fully
  typed (this fixed ~40 latent type errors).
- CI (`.github/workflows/ci.yml`): typecheck + lint + demo-mode guard for the
  app, typecheck for the admin panel. `eas.json` with dev/preview/production.
- **Local verification run:** `tsc --noEmit` ✅ and `eslint` ✅ on the app;
  `tsc --noEmit` ✅ on the admin panel (deps actually installed, not assumed).

### Sprint 2 — Admin panel & content pipeline ✅ (deploy pending)

- **Admin panel built** in-repo at `admin/` (Next.js 14). Decision: in-repo
  instead of a separate Lovable project — same Supabase backend, one repo to
  maintain; Lovable can still replace it later. Auth = magic link +
  `admin_users` gate; all writes go through **RLS as the signed-in admin**
  (no service key in the browser); every mutation writes `audit_log`.
  Pages: Dashboard (stats + pipeline health), Agenda (CRUD, overlap warnings,
  speaker assignment), Speakers, Partners, FAQs, Attendees (search, edit,
  **CSV import**), Q&A moderation, Push composer (categories, individuals
  targeting, scheduling), Auction manager (close & assign winner → auto
  "you won" push), Check-in desk (keyboard-wedge QR scanning), Reports
  (check-ins by day, top sessions, partner-leads CSV export).
- **Realtime <30 s (spec §10.7):** app-side `useRealtimeInvalidation` hook
  subscribes to sessions/speakers/partners/faqs/auction and invalidates query
  caches on any change.
- **AC sync scheduled** every 15 min via pg_cron (runs and fails cleanly until
  AC credentials exist).
- `sync_runs` table gives admins pipeline observability (surfaced on the
  dashboard).

### Sprint 3 — Connections, notes & Q&A ✅ (device pass pending)

- **Security fix shipped:** `qr-connect`, `business-card-ocr`, `check-in`,
  `ac-event-emit` now derive the caller from the JWT (`_shared/auth.ts`) —
  request bodies can no longer impersonate other attendees. `ac-event-emit`
  also allow-lists event names.
- Real QR rendering (`regrowth:<token>` payload) + client/server prefix
  validation; scan success shows the person's name; business-card OCR is
  rate-limited (25/day/attendee) and auto-matches captured emails to
  attendees; pending cards listed in Connection Hub with follow-up actions.
- Notes autosave hardened (debounce + 3× retry + visible Saved/Saving/
  Reconnecting state); **scheduled AI summaries** sweep sessions that ended
  20–60 min ago, twice hourly.
- **Anonymous Q&A leak closed:** new `public_questions` view masks authors
  server-side; the app reads only the view. Upvotes now toggle.
- Q&A moderation UI live in the admin panel.

### Sprint 4 — Push, check-in & auction ✅ (APNs/device pass pending)

- **`place_bid` RPC**: row-locked, validates open/close + minimum increment,
  updates `current_bid` atomically, queues the outbid push; direct `bids`
  inserts revoked. App + admin use it exclusively.
- **Notification pipeline**: `notifications` rows are a queue;
  `process_queue` cron (every minute) delivers via `send-push` in priority
  order (announcement > session > auction > don't-miss > people > spotlight).
  `send-push` v2: single grouped query for the 4/day cap (N+1 fixed), dead
  Expo tokens pruned from tickets.
- **Scheduled jobs live and verified running** (cron.job_run_details +
  sync_runs both green): session-starting sweep (T-15, picks ∪ followed
  speakers, deduped per session), note summaries, daily suggestions
  (re-entrant 25/batch through a 2 h window), people-to-meet daily nudge.
- **Check-in**: per-day `check_ins` table; three paths — self ("I'm here" on
  Home), staff QR (admin-gated), geofence (function support ready; app-side
  geofence prompt deferred — see §3).
- Push deep links: notifications carry `data.route`; the app routes on tap.

### Sprint 5 — Hardening & launch prep ◐ (what's automatable is done)

- Security advisors re-run after all migrations → **no new findings**; all
  earlier WARNs remediated except `citext` in `public` (accepted, documented).
- `scheduled-tasks` rejects end-user JWTs (role check) — only cron/service
  callers can trigger jobs.
- Cost controls: OCR rate limit, suggestions cached per-day, suggestion
  batches capped.
- Demo-mode production guard in CI.
- Sentry wired (no-op until DSN set).
- **Event-day runbook** written for non-engineers: `docs/runbook.md`.
- Remaining Sprint 5 items are inherently human/device-bound — see §3.

## 2. Live infrastructure inventory

| Thing | State |
| --- | --- |
| Migrations applied | 8 (`initial_schema` → `cron_schedules`), all mirrored in `supabase/migrations/` |
| Edge functions | 10 deployed, all v2 where rewritten (`scheduled-tasks` new) |
| Cron jobs | 6 scheduled and verified firing (queue every min; sweeps 5/30 min; daily batches) |
| Seed data | Event, 3 speakers, 5 sessions, 3 partners, 3 FAQs, 4 attendees (incl. dirk@datatube.app), dirk = owner admin |
| Auth | Trigger-based linking + unknown-email rejection, DB-verified |
| Realtime | sessions/questions/upvotes/auction/bids/notifications published |

## 3. Everything still needed (the launch checklist)

### Credentials / env (blockers for their features, not for the build)

| Item | Where it goes | Unblocks |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Supabase → Edge Functions → Secrets | AI summaries, suggestions, card OCR |
| `ACTIVECAMPAIGN_API_URL` / `_API_KEY` / `_LIST_ID` | Function secrets | Attendee sync, partner-lead automations, event emails |
| `WEBSITE_WEBHOOK_SECRET` (any strong string; share with website dev) | Function secrets | Website signup → attendees |
| `EXPO_ACCESS_TOKEN` | Function secrets | Authenticated Expo push (works unauthenticated at low volume meanwhile) |
| APNs key + Apple Developer account (Kylie's org) | EAS credentials | Real push to iPhones; TestFlight |
| `EXPO_PUBLIC_SENTRY_DSN` (app) + PostHog key | `.env` / EAS env | Crash + product analytics |
| Custom SMTP (e.g. Resend/Postmark) | Supabase → Auth → SMTP | Removes ~2 emails/hour magic-link ceiling — **required before the event** |

### Dashboard configuration (5 minutes, no API available)

- Auth → URL Configuration: add `regrowth://auth-callback`,
  `http://localhost:8081` (app dev), `http://localhost:3000` (admin dev),
  and the deployed admin URL when it exists.

### Deploys / builds (human-triggered)

- Admin panel → Vercel (`admin/`, set the 3 `NEXT_PUBLIC_*` vars, add its URL
  to auth redirects).
- `eas build --profile preview` → install on iPhone → run the §10 definition-
  of-done pass on hardware (magic link, QR connect between two devices,
  notes → summary, T-15 push, <30 s admin edit, partner-interest → AC).
- `eas.json` → `appleTeamId` placeholder needs Kylie's real team ID.

### Deliberately deferred (documented, not forgotten)

- Brand fonts (licensing deferred by decision 2026-07-17; iOS built-ins map
  to the brand tokens).
- Geofence check-in prompt app-side + Bluetooth beacons (function support
  exists; needs on-site testing anyway).
- "Don't miss this" concurrent-session nudges (queue + priority slot exist;
  sweep not yet written).
- Live in-session mode (slides/polls), gallery uploads from camera roll,
  podcast RSS mirror job, Android polish, RLS pgTAP suite in CI, `citext`
  schema move, multi-event support.

## 4. Verification evidence

- `tsc --noEmit` exit 0 (app + admin); `eslint` exit 0 (app).
- Auth trigger test: `unknown_email_rejected=PASS`, `known_email_user_id_linked=t`.
- `cron.job_run_details`: all recent runs `succeeded`.
- `sync_runs`: `session_starting {queued:0, sessions:0}` (correct — event is
  in August), `note_summaries {notes:0}` — pipeline alive end-to-end.
- Security advisors: no unremediated findings (one accepted WARN documented).
