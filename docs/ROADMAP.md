# REGROWTH® Conference App — Production Roadmap

**Status date:** 2026-07-16
**Repo:** `dirka-datatube/regrowth-conference-app`, branch `claude/regrowth-conference-app-4EqIq`
**Audience:** Dirk (DataTube), Kylie's team (REGROWTH), and any AI agent picking up a sprint.

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

**Nothing has run against a live Supabase project.** The scaffold is code-complete
but unverified end-to-end. Specific known defects and gaps, in priority order:

1. **🔴 Login is broken by design right now.** `lib/auth.ts` sends magic links with
   `shouldCreateUser: false`, but no `auth.users` rows exist — so every login
   fails. Even if it succeeded, nothing ever populates `attendees.user_id`, so
   RLS (`current_attendee_id()`) would return null and the app would render
   empty. Fix: DB trigger linking `auth.users` → `attendees` by email +
   a decision on the signup strategy. **Sprint 1, task 1.**
2. **🔴 No scheduled jobs.** AC sync "every 15 mins", daily suggestions,
   post-session summaries, and session-starting pushes all need pg_cron (or an
   external scheduler). None is wired. **Sprints 2 & 4.**
3. **🟠 Auction has no server-side bid logic.** `bids` insert doesn't update
   `auction_items.current_bid`, nothing validates amount > current, no outbid
   notification. Race conditions guaranteed. Needs an RPC + trigger. **Sprint 4.**
4. **🟠 QR code rendering is a placeholder.** `components/QrModal.tsx` renders a
   stub box; `react-native-qrcode-svg` needs adding. **Sprint 3.**
5. **🟠 Brand fonts missing** (licensed files). App falls back to system fonts;
   `useBrandFonts()` will fail at build until files land or the call is guarded.
   **Sprint 1.**
6. **🟡 Package drift:** `expo-image-picker` needs ~15.1.0; `sentry-expo` is
   deprecated → replace with `@sentry/react-native`. (Seen as warnings on first
   local run.) **Sprint 1.**
7. **🟡 Hand-written DB types** (`types/database.ts`) — replace with generated
   types once a project is linked. **Sprint 1.**
8. **🟡 Storage RLS policies call `current_attendee_id()` unqualified** — inside
   the `storage` schema this may not resolve; should be
   `public.current_attendee_id()`. **Sprint 1 migration fix.**
9. **🟡 No tests, no CI, no EAS config.** **Sprint 1.**
10. **🟡 Demo mode ships in the bundle** — must be excluded or hard-guarded in
    production builds. **Sprint 5 (checked in Sprint 1 CI).**
11. **🟡 `send-push` runs one count-query per attendee** for the daily cap (N+1).
    Fine for hundreds of attendees; optimise before scaling. **Sprint 4.**
12. **⬜ Admin panel does not exist.** It's a separate Lovable/Next.js project
    against the same Supabase instance. **Sprint 2 is where it must land.**

### External dependencies (not code — chase these in parallel)

- Supabase project (production) — who owns the org/billing
- ActiveCampaign API credentials + list IDs + automation inventory
- Apple Developer account (must be Kylie's company per the brief) + APNs key
- Licensed font files: Butler, Northwell Alt, DIN
- Brand sign-off process for CommBank page content
- Website platform confirmation (WordPress vs Webflow) for the signup webhook

---

## 2. The five sprints

Each sprint has a full brief in `docs/sprints/`. They are strictly ordered —
each one's Definition of Done is a prerequisite for the next. Suggested
cadence: 2 weeks each, ~10 working days. Solo-developer-plus-agent friendly.

| # | Sprint | Outcome when done | Spec DoD items |
| --- | --- | --- | --- |
| 1 | [Live backend & working auth](sprints/sprint-01-live-backend-and-auth.md) | Real device logs in via magic link against live Supabase; CI green; app buildable | §10.1 |
| 2 | [Admin panel & content pipeline](sprints/sprint-02-admin-and-content-pipeline.md) | Kylie's team loads real content; it appears on device < 30 s; AC sync runs on schedule | §10.2, §10.7 |
| 3 | [Connections, notes & Q&A](sprints/sprint-03-connections-notes-qa.md) | QR connect, business-card OCR, AI note summaries, moderated Q&A all work end-to-end | §10.3, §10.4, §10.5 |
| 4 | [Push, check-in & auction](sprints/sprint-04-push-checkin-auction.md) | Session reminders arrive on time; check-in works 3 ways; auction is race-safe & realtime | §10.6, §10.8 |
| 5 | [Hardening & TestFlight launch](sprints/sprint-05-hardening-and-testflight.md) | Security/perf audit passed, observability live, TestFlight external build in Kylie's hands, event-day runbook | all of §10 verified |

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
