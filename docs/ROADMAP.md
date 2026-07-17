# REGROWTH® Conference App — Production Roadmap

**Status date:** 2026-07-17
**Repo:** `dirka-datatube/regrowth-conference-app`
**Backend:** Supabase project **"ReGrowth App"** (`blcfeguqhnggyxvexggy`, ap-northeast-1) — **live: schema + RLS applied, 9 edge functions deployed, seed data loaded**
**Audience:** Dirk (DataTube), Kylie's team (REGROWTH), and any AI agent picking up a sprint.

**Decisions log:**
- 2026-07-17 — Brand font licensing **deferred**; shipping iOS built-in fallbacks (Georgia / Snell Roundhand / Helvetica Neue), mapped in `tailwind.config.js`.

---

## 1. Where we are today

### Built (scaffold, committed)

| Area | State |
| --- | --- |
| Expo app shell | ✅ All screens from the spec exist: 4 tabs, 12 menu sections, detail pages, auth flow |
| Brand system | ✅ NativeWind theme wired to the REGROWTH digital palette + typography tokens |
| Database | ✅ Full schema migration (22 tables, spec §5), RLS on every table, storage buckets, realtime publications, seed data |
| Edge functions | ✅ 9 functions written: AC sync/emit, website webhook, push fan-out, Claude summaries/suggestions/OCR, QR connect, check-in |
| State/data layer | ✅ Zustand + React Query with AsyncStorage persistence (offline cache) |
| Demo mode | ✅ `npm run demo` renders the whole app in a browser with canned data, zero setup |

### Not yet real (the honest list)

The backend is now provisioned (2026-07-17): all four migrations applied to
the live project, seed data loaded (including test attendees — Dirk's email
can log in), all 9 edge functions deployed, and the security-advisor WARNs
remediated in `20260101000300_security_hardening.sql`. Remaining defects and
gaps, in priority order:

**Update 2026-07-17 (evening): Sprints 1–4 executed, Sprint 5 partially —
see [`docs/reports/2026-07-17-sprint-execution.md`](reports/2026-07-17-sprint-execution.md)
for the full record and remaining launch checklist.**

1. ~~🔴 Login broken (auth→attendee linking)~~ **FIXED + DB-verified** —
   trigger rejects unknown emails, links `user_id`; client updated. Device
   pass pending.
2. ~~🔴 No scheduled jobs~~ **FIXED** — 6 pg_cron jobs live and verified
   firing (AC sync, notification queue, session reminders, note summaries,
   daily suggestions, people-to-meet).
3. ~~🟠 Auction race conditions~~ **FIXED** — `place_bid` RPC (row lock,
   validation, atomic update, outbid push); direct bid inserts revoked.
4. ~~🟠 QR placeholder~~ **FIXED** — real QR render with `regrowth:` payload
   prefix, validated client + server side.
5. ~~🟠 Brand fonts missing~~ **RESOLVED by decision** — licensing deferred;
   iOS built-in fallbacks mapped in `tailwind.config.js`.
6. ~~🟡 Package drift~~ **FIXED** — image-picker bumped, Sentry migrated to
   `@sentry/react-native`, QR libs added.
7. ~~🟡 Hand-written DB types~~ **FIXED** — generated types committed;
   client + domain aliases derive from them.
8. ~~🟡 Storage RLS unqualified function call~~ **FIXED**.
9. ~~🟡 No CI / EAS~~ **FIXED** — GitHub Actions (app typecheck+lint+demo
   guard, admin typecheck) + `eas.json`. RLS test suite still to come (below).
10. ~~🟡 Demo mode unguarded~~ **FIXED** — CI fails if demo mode appears in
    build profiles.
11. ~~🟡 send-push N+1~~ **FIXED** — single grouped cap query + dead-token pruning.
12. ~~⬜ Admin panel missing~~ **BUILT** — in-repo `admin/` (Next.js 14),
    RLS-scoped, audit-logged. Vercel deploy pending.
13. ~~🟡 Edge functions trust caller-supplied IDs~~ **FIXED** — identity now
    derived from the JWT in all attendee-facing functions.
14. **🟡 Advisor WARN accepted:** `citext` in `public` schema. Revisit at launch hardening.
15. **⬜ Still open (device/human-bound):** on-device §10 verification, APNs +
    TestFlight, custom SMTP, function secrets (Anthropic/AC/Expo), geofence
    prompt app-side, "don't miss this" sweep, RLS pgTAP suite, gallery
    uploads, podcast RSS mirror. Full list: the execution report §3.

### Live backend facts (for agents)

- Project ref: `blcfeguqhnggyxvexggy` · URL: `https://blcfeguqhnggyxvexggy.supabase.co`
- Event id: `00000000-0000-0000-0000-000000000001` (REGROWTH Annual Conference 2026)
- Migrations applied: `initial_schema`, `storage_buckets`, `auth_user_linking`, `security_hardening`
- Edge functions deployed (v1): all 9; `website-signup` has `verify_jwt=false` (uses `x-webhook-secret`)
- Function secrets still unset: `ANTHROPIC_API_KEY`, `ACTIVECAMPAIGN_*`, `WEBSITE_WEBHOOK_SECRET`, `EXPO_ACCESS_TOKEN` — Claude/AC/push features will error cleanly until set
- Seeded test attendees: `dirk@datatube.app` (can log in), plus 3 `*@regrowth.example` fixtures

### External dependencies (not code — chase these in parallel)

- Supabase project (production) — who owns the org/billing
- ActiveCampaign API credentials + list IDs + automation inventory
- Apple Developer account (must be Kylie's company per the brief) + APNs key
- Licensed font files: Butler, Northwell Alt, DIN
- Brand sign-off process for CommBank page content
- Website platform confirmation (WordPress vs Webflow) for the signup webhook

---

## 2. The sprints

Each sprint has a full brief in `docs/sprints/`. Strictly ordered — each
one's Definition of Done is a prerequisite for the next.

### Phase one (executed 2026-07-17 — see the execution report)

| # | Sprint | Status |
| --- | --- | --- |
| 1 | [Live backend & working auth](sprints/sprint-01-live-backend-and-auth.md) | ✅ done (device pass → Sprint 10) |
| 2 | [Admin panel & content pipeline](sprints/sprint-02-admin-and-content-pipeline.md) | ✅ built (Vercel deploy → Sprint 9) |
| 3 | [Connections, notes & Q&A](sprints/sprint-03-connections-notes-qa.md) | ✅ done (device pass → Sprint 10) |
| 4 | [Push, check-in & auction](sprints/sprint-04-push-checkin-auction.md) | ✅ done (APNs → Sprint 10) |
| 5 | [Hardening & launch prep](sprints/sprint-05-hardening-and-testflight.md) | ◐ automatable portion done; remainder redistributed into Sprints 9–10 |

### Phase two (executed 2026-07-17 — see [the phase-two report](reports/2026-07-17-phase-two-execution.md))

| # | Sprint | Status |
| --- | --- | --- |
| 6 | [**Brand UI/UX overhaul**](sprints/sprint-06-brand-ui-overhaul.md) | ✅ done — light-first system, 4-tab nav, Home v2 (PDF ratification + screenshot gallery pending) |
| 7 | [Speed & frictionless entry](sprints/sprint-07-speed-and-frictionless-entry.md) | ✅ done — expo-image/FlashList/prefetch/optimistic, OTP fallback, geofence check-in, QR posters (device budgets need hardware) |
| 8 | [Onboarding & personalisation v2](sprints/sprint-08-onboarding-and-personalisation.md) | ✅ done — onboarding, chips, don't-miss + podcast jobs live, gallery uploads |
| 9 | [Content & integrations go-live](sprints/sprint-09-content-integrations-golive.md) | ◐ automatable done — creds/SMTP/Vercel/content are human-gated |
| 10 | [TestFlight, UAT & readiness](sprints/sprint-10-testflight-uat-event-readiness.md) | ◐ tests + RLS suite (caught & fixed a real policy bug) + privacy manifest done — Apple chain + UAT human-gated |

**Next actions live in [`docs/launch-checklist.md`](launch-checklist.md).**

**Brand direction note (Sprint 6 input):** REGROWTH's real collateral
(email screenshots, 2026-07-17) is **light-first** — Snow/Cloud surfaces,
Midnight serif headings, Earth CTAs, Ocean accents, RG monogram — while the
original build prompt specified a Midnight-dark default. Sprint 6 resolves
this deliberately (recommendation: light-first with dark reserved for hero
moments), ratified against the brand guidelines PDF once loaded into
`docs/brand/`.

## 3. How to run a sprint with an AI agent

Each sprint doc is written to be self-contained: context, prerequisites, tasks
with acceptance criteria, and explicit out-of-scope lines. To hand one to an
agent (Claude Code or similar):

1. Open a session on this repo, branch from the current mainline.
2. Prompt: *"Read `docs/ROADMAP.md` and `docs/sprints/sprint-0N-….md`. Execute
   the sprint tasks in order. Respect the acceptance criteria and the
   out-of-scope list. Commit per task, push, and report against the Definition
   of Done."*
3. Human reviews the DoD checklist at sprint end; anything unmet rolls into the
   next sprint's prerequisites — update the sprint doc in the same PR.

Rules for agents working this repo:

- **RLS is never disabled** to make a feature work. Fix the policy.
- **Secrets never enter the repo or the app bundle.** Server-side keys live in
  Supabase function secrets; the app gets only `EXPO_PUBLIC_*` values.
- **Brand voice in all user-facing copy:** "we" not "I", solutions-focused,
  REGROWTH always capitalised, ® on first use per screen.
- Update this roadmap's "known defects" list when you fix or discover one.
