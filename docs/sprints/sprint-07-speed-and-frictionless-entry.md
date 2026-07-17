# Sprint 7 — Speed & frictionless entry

**Goal:** the app feels instant, and getting in — including venue check-in —
takes one tap or zero. The previous app was "plain, boring, slow"; this
sprint kills "slow" measurably.

**Duration:** ~2 weeks · **Requires:** Sprint 6 (measure the real UI, not the scaffold)


> **Progress 2026-07-17:** Executed in the phase-two autonomous run — see
> [`docs/reports/2026-07-17-phase-two-execution.md`](../reports/2026-07-17-phase-two-execution.md)
> and [`docs/launch-checklist.md`](../launch-checklist.md) for what shipped
> and the remaining human-gated items.

---

## Performance budgets (the contract for this sprint)

| Metric | Budget | Measured how |
| --- | --- | --- |
| Cold start → interactive Home | < 2.0 s (mid-range iPhone) | Sentry app-start transaction |
| Warm resume → content | < 400 ms | Sentry |
| Tab switch / navigation | 60 fps, no blank frames | Perf monitor + manual capture |
| Agenda scroll (60 sessions) | 60 fps | FlashList metrics |
| Image first paint (headshots) | < 300 ms cached, progressive fresh | expo-image events |
| Check-in (tap → confirmed) | < 1.5 s round trip | PostHog timing event |

## Tasks

### 1. Speed
- **Lists:** replace ScrollView-rendered collections (agenda, attendees,
  gallery, Q&A) with FlashList; paginate the attendee directory (50/page,
  search server-side).
- **Images:** move all remote images to `expo-image` with disk caching +
  Supabase Storage transform URLs (`?width=`) sized per slot (48/96/240px);
  blurhash-style placeholder from the monogram.
- **Startup:** Hermes verified, `inlineRequires`, defer PostHog/Sentry init
  to after first frame, lazy-mount More-section routes, strip demo data from
  production bundles via conditional require.
- **Data:** prefetch the day's sessions + speakers + my picks in parallel on
  login; optimistic updates for schedule picks, follows, upvotes (write
  locally, reconcile on error); keep realtime invalidation but debounce
  bursts.
- **Offline:** cached shell renders instantly on airplane mode; mutations
  queue a friendly "we'll send that when you're back online" for notes only
  (bids/questions stay online-only by design).

### 2. Frictionless entry
- **Stay signed in forever** (secure token refresh already persists — verify
  session survives OS updates/reinstalls policy and document).
- **Magic-link polish:** detect the mail app (`Open Mail` button), 6-digit
  OTP fallback (`verifyOtp`) for attendees whose corporate mail strips
  links — this is the #1 real-world login failure at conferences.
- **Zero-tap check-in:** on first app-foreground inside the venue geofence
  (event days only), show a one-tap branded sheet — "Welcome to REGROWTH
  2026 — check in?" — wired to the existing `check-in` function
  (`source: geofence`). Full auto (no prompt) stays off — consent matters.
- **Venue QR posters:** deep-link `regrowth://check-in` QR at the doors —
  scanning with the camera opens the app straight into self check-in;
  generate the poster PDF (admin Reports page, print-ready).
- **Staff path stays**: check-in desk already live in the admin panel.

### 3. Prove it
- Sentry performance dashboards (app start, nav transactions) + PostHog
  funnel: app open → Home interactive → checked in.
- Before/after numbers recorded in this doc's PR description against the
  budgets table; any budget missed = sprint not done.

## Out of scope
Visual changes (Sprint 6 owns look), new features, Android tuning.

## Definition of Done
- [ ] Every budget in the table met and evidenced (before/after)
- [ ] FlashList + expo-image everywhere; directory paginated
- [ ] Optimistic picks/follows/upvotes; offline shell instant
- [ ] OTP fallback login shipped; mail-app shortcut on check-email screen
- [ ] Geofence one-tap check-in sheet live; venue QR poster generator in admin
- [ ] Perf dashboards live; regression alert configured
