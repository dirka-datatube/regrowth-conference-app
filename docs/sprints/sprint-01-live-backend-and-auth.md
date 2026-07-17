# Sprint 1 — Live backend & working auth

**Goal:** a real person on a real iPhone signs in with a magic link against a
live Supabase project and lands on a Home screen showing their own name.
Repo builds cleanly, CI enforces it staying that way.

**Duration:** ~2 weeks · **Blocks:** every later sprint
**Spec DoD covered:** §10.1 (Kylie can log in via magic link)

---

## Context for the agent

The repo is a complete but unverified scaffold (see `docs/ROADMAP.md` §1).
This sprint turns it from "compiles and demos" into "runs against production
infrastructure". The single most important fix is the auth→attendee linking
defect (Task 1) — nothing else in the app functions until it's done.

Read before starting: `lib/auth.ts`, `lib/supabase.ts`,
`supabase/migrations/20260101000000_initial_schema.sql` (esp. the
`current_attendee_id()` helper and `attendees` table), `app/_layout.tsx`.

> **Progress 2026-07-17:** Tasks 1 and 2 are DONE (applied directly to the live
> project "ReGrowth App" `blcfeguqhnggyxvexggy` via MCP): all four migrations
> applied, trigger-based auth linking live, client auth updated, seed data
> loaded, all 9 functions deployed, advisor WARNs remediated. Fonts decision:
> deferred — fallbacks shipped. REMAINING: task 3 (package bumps + Sentry
> swap + QR lib), task 4 (CI + EAS), task 5 (device verification), plus the
> human dashboard items below.
>
> **Human dashboard items (no API access — Dirk):**
> - Auth → URL Configuration: add `regrowth://auth-callback` (+ `exp://` dev URLs) as redirect URLs
> - Edge Functions → Secrets: set `ANTHROPIC_API_KEY`, `WEBSITE_WEBHOOK_SECRET`; (`ACTIVECAMPAIGN_*`, `EXPO_ACCESS_TOKEN` when available)
> - Note: default Supabase SMTP is rate-limited (~2 magic-link emails/hour) — fine for testing, needs custom SMTP before the event

## Prerequisites (human-provided, confirm before starting)

- [x] Supabase production project created — "ReGrowth App" (`blcfeguqhnggyxvexggy`)
- [ ] Apple Developer account access (for device builds; APNs comes in Sprint 4)
- [x] Font decision — licensing deferred, iOS built-in fallbacks shipped (2026-07-17)

## Tasks

### 1. Fix auth → attendee linking (the login blocker) 🔴

Current behaviour: `sendMagicLink()` uses `shouldCreateUser: false`; no
`auth.users` rows exist; `attendees.user_id` is never set. Login always fails.

Implement:

1. New migration: `handle_auth_user_linked()` trigger on `auth.users`
   (AFTER INSERT) that finds the `attendees` row with matching email
   (citext compare) and sets `user_id`. If no attendee matches, raise —
   we do not want orphan auth users.
2. Change `sendMagicLink()` to `shouldCreateUser: true`, but add a
   [Supabase Auth hook](https://supabase.com/docs/guides/auth/auth-hooks)
   (`before user created`) or an edge-function pre-check that rejects emails
   not present in `attendees`. Registration stays website/AC-driven; the app
   never creates attendees.
3. Handle re-sync: if an attendee's email changes in AC, the link must survive
   (`user_id` keyed, email updated in place — verify `ac-sync-attendees` upsert
   doesn't clobber `user_id`; it upserts on `ac_contact_id`, confirm column list).

**Acceptance:** fresh email present in `attendees` → magic link → session →
`useAttendee()` returns the row → Home shows the attendee's first name.
Email *not* in `attendees` → friendly failure ("we couldn't find your
registration"), no auth user created.

### 2. Provision + verify the backend

- Link repo to the Supabase project (`supabase link`), apply both migrations,
  run seed. Fix anything that fails to apply — known issue: storage policies
  must call `public.current_attendee_id()` fully qualified (new fix-up
  migration; do not edit applied migrations).
- Deploy all 9 edge functions; set secrets (`ANTHROPIC_API_KEY`,
  `ACTIVECAMPAIGN_*`, `WEBSITE_WEBHOOK_SECRET`, `EXPO_ACCESS_TOKEN`).
  Functions with missing third-party creds (AC) may stay untested but must
  deploy and return clean errors.
- Configure Auth: magic link email template (REGROWTH voice), redirect URLs
  for the `regrowth://` scheme and Expo dev URLs.
- Run `supabase gen types` → replace hand-written `types/database.ts` with
  generated types (keep the file path; re-export domain aliases so imports
  don't churn).

**Acceptance:** `select * from attendees` works via the app's anon key + JWT
under RLS; all functions deployed; typecheck passes against generated types.

### 3. Buildable, current, linted

- Bump `expo-image-picker` to ~15.1.0; replace deprecated `sentry-expo` with
  `@sentry/react-native` (init in `app/_layout.tsx`, no-op without DSN).
- Add `react-native-qrcode-svg` + `react-native-svg` now (used Sprint 3, cheap
  to install here while touching deps).
- Fonts: drop licensed files into `assets/fonts/` if provided; otherwise make
  `useBrandFonts()` tolerate missing files (conditional require with fallback)
  so builds never break on fonts.
- `npx tsc --noEmit` and `npx eslint .` clean.

### 4. CI + EAS

- GitHub Actions workflow: install → typecheck → lint on every PR/push.
- Add a CI guard that fails if `EXPO_PUBLIC_DEMO_MODE` is set in any
  production build profile.
- `eas.json` with `development`, `preview`, `production` profiles; EAS project
  ID into `app.json`. Produce one `preview` build installable on a device.

### 5. Device verification (human-in-the-loop)

Manual test script (write it as `docs/testing/sprint-01-checklist.md`):
install preview build → magic link → Home renders → agenda shows seed
sessions → sign out → bad-email rejection path.

## Out of scope

Admin panel, AC sync scheduling, push notifications, QR scanning UX, content.

## Definition of Done

- [ ] Magic-link login works on a physical iPhone against live Supabase
- [ ] Unknown email is rejected with branded copy, creates nothing
- [ ] Both migrations + fix-up applied cleanly; storage policies functional
- [ ] All 9 edge functions deployed with secrets set
- [ ] Generated DB types in the repo; typecheck + lint green in CI
- [ ] EAS preview build installable; sprint-01 manual checklist passes
- [ ] `docs/ROADMAP.md` defect list updated
