# Execution report — Phase two, Sprints 6–10 (2026-07-17)

Sequential autonomous run over the five phase-two briefs. Everything
automatable was executed and verified; the remaining items are credentials,
builds, and human sign-offs — all consolidated in
[`docs/launch-checklist.md`](../launch-checklist.md).

## Sprint 6 — Brand UI/UX overhaul ✅

- **Light-first design system** from the real collateral: semantic tokens
  (`canvas/surface/ink/cta/accent/line` + `moment` for dark hero screens) in
  `tailwind.config.js`; every primitive rebuilt (Screen, Type, Button, Card,
  new Header/Skeleton/Monogram, branded EmptyState). Provisional until the
  brand PDF ratifies it (drop into `docs/brand/`).
- **Navigation simplified:** Home · Agenda · Connect · More. Alerts → Home
  bell; Notes → More + session flows; Connect promotes the social heart of
  the event; More is grouped (Experience/Learn/Support) with a profile row.
  The 12-item flat menu is gone; two-tap rule holds.
- **Home v2:** greeting + script flourish, check-in chip, "your day at a
  glance" timeline, live-now feature card, people carousel, partner
  spotlight, quick access.
- Haptics on success moments; accessibility roles/labels; moment screens
  (welcome, QR, scanner, check-in landing) deliberately Midnight.
- Screenshot gallery: blocked in this sandbox (Expo dev server needs
  open egress) — 2-minute job on any laptop, instructions in
  `docs/brand/screens/README.md`.

## Sprint 7 — Speed & frictionless entry ✅

- expo-image everywhere via `Photo` (disk cache, fade-in, width-transform
  URLs); FlashList + server-side pagination on the directory; Sentry init
  deferred; sessions/speakers prefetched on login; optimistic pick/follow
  toggles.
- **OTP fallback login** (6-digit code) for link-stripping corporate mail;
  **geofence one-tap check-in** (event days, consent-first, only uses
  already-granted permission); `regrowth://check-in` deep-link landing;
  **print-ready venue QR poster** page in the admin.
- Live perf evidence where measurable here: directory query **0.65 ms** at
  500 attendees (rolled-back seed, EXPLAIN ANALYZE). Device budgets
  (cold start < 2 s etc.) need hardware — table in the sprint-07 brief.

## Sprint 8 — Onboarding & personalisation v2 ✅

- 3-step, skippable, <60 s onboarding: photo → headshots bucket, curated
  interest chips (20-item taxonomy in `lib/interests.ts`), visibility +
  notification comfort. Emits `onboarding_complete` to AC. First-run
  redirect gate + Home completeness nudge.
- **"Don't miss this" live:** cron sweep queues one deduped nudge when ≥2
  concurrent sessions are ~30 min out and the attendee picked none.
- **Podcast RSS mirror** job (needs `PODCAST_RSS_URL` secret); unique index
  added for idempotent upserts. Gallery uploads (new RLS policy applied
  live). Notes "email me" export via AC.

## Sprint 9 — Content, integrations & comms go-live ◐ (automatable done)

- Admin direct-to-bucket **Upload widgets** (headshots/logos/auction) with
  clipboard-copied URLs.
- `docs/integrations/activecampaign.md`: secrets, field mapping + protected
  columns, outbound event → automation table, webhook contract, health
  queries, known email-conflict limit.
- Branded magic-link email template (keeps `{{ .Token }}` for the OTP path).
- Human-gated remainder (credentials, SMTP, Vercel deploy, real content,
  team training, §11 decisions) → launch checklist.

## Sprint 10 — Readiness ◐ (automatable done)

- **Push eligibility extracted to a pure module** + 5 Deno unit tests
  (opt-out, cap, admin bypass, dead token, priority order); CI now runs
  them (`denoland/setup-deno`). send-push v3 deployed using the module.
- **RLS assertion suite** (`supabase/tests/rls_assertions.sql`) — runs
  against production, always rolls back. **Verified live: PASS** on notes
  isolation, anonymous authorship, hidden attendees, RPC-only bids, admin
  tables. It also **caught and fixed a real bug**: the `admin_users`
  self-read policy recursed infinitely (42P17) — would have broken the
  admin login gate; fixed with a security-definer helper (migration
  `20260101001000`).
- Scale timing at 500 attendees + 60 sessions: hot path indexed and sub-ms.
- iOS `privacyManifests` added to `app.json` (UserDefaults, file
  timestamp, boot time, disk space — standard RN/Expo reasons).
- Hardware-bound remainder (APNs, TestFlight, ten-point §10 pass, UAT
  cycles, go/no-go) → launch checklist.

## Verification summary

| Check | Result |
| --- | --- |
| `tsc --noEmit` (app) | ✅ exit 0 |
| `eslint` (app) | ✅ exit 0 |
| `tsc --noEmit` (admin) | ✅ exit 0 |
| RLS assertions (live, rolled back) | ✅ PASS (6/6) |
| Directory query @ 500 attendees | ✅ 0.65 ms |
| Cron pipelines | ✅ all `succeeded` (job_run_details) |
| Edge functions | 10 active; send-push v3, scheduled-tasks v2 |
| Migrations | 12 applied, all mirrored in-repo |

## The complete "still needed" list

Everything that remains lives in **`docs/launch-checklist.md`** — secrets
(Anthropic, ActiveCampaign, Expo, podcast RSS, webhook), auth redirect URLs +
custom SMTP, Apple/EAS/TestFlight chain, brand PDF ratification + screenshot
gallery, real content load, admin team onboarding + drill, AC automations,
the ten-point hardware verification, and the go/no-go review.
