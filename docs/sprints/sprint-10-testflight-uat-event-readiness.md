# Sprint 10 — TestFlight, UAT & event readiness

**Goal:** the app is on real iPhones via TestFlight, has survived two UAT
cycles and a scale test, and the whole §10 definition-of-done is re-verified
on hardware. Ends with a go/no-go review before the event.

**Duration:** ~2 weeks + event-week support · **Requires:** Sprints 6–9


> **Progress 2026-07-17:** Executed in the phase-two autonomous run — see
> [`docs/reports/2026-07-17-phase-two-execution.md`](../reports/2026-07-17-phase-two-execution.md)
> and [`docs/launch-checklist.md`](../launch-checklist.md) for what shipped
> and the remaining human-gated items.

---

## Tasks

### 1. Build & distribution pipeline
- APNs key (Kylie's Apple Developer org) into EAS; real `appleTeamId` in
  `eas.json`; production build channel + OTA update policy (expo-updates:
  JS fixes during event week without re-review).
- `PrivacyInfo.xcprivacy` + App Store privacy nutrition labels (camera,
  location, contact data); consent copy from Sprint 9 decisions.
- TestFlight: internal group (team) → external group (pilot attendees).

### 2. Hardware verification (the spec §10 pass, at last)
Two-device runs, recorded on video, checklist committed:
1. Magic link + OTP fallback login
2. Personalised Home (suggestion, partner, next session)
3. Speaker browse → LinkedIn → follow
4. QR connect both directions; stranger-QR rejected
5. Notes → AI summary after session end
6. T-15 session push on a picked *and* a followed session; deep link works
7. Admin agenda edit visible on device < 30 s
8. Partner "I'm interested" → AC automation fires
9. Auction: concurrent bids race-safe; outbid + winner pushes
10. Check-in all three ways; geofence sheet at the venue (site visit)

### 3. Scale & resilience test
- Seed staging-scale data: ~500 attendees, 60 sessions, 20 partners.
- Load pass: Home queries, directory pagination, realtime channels, and the
  notification queue (force 6+ queued → cap + priority behaviour verified).
- The 4/day cap and priority-drop logic extracted into a Deno test run in CI
  (the one automated-test debt item carried since Sprint 4).
- RLS test suite (pgTAP or SQL assertions) in CI: cross-attendee isolation,
  hidden attendees, anonymous authorship, anon-role denial.

### 4. UAT with pilots
- ~15 pilots (staff + friendly attendees) for two structured cycles:
  scripted tasks + free roam; feedback triaged into fix / event-week-OTA /
  post-event.
- Crash-free sessions ≥ 99.5 % before widening the external group.

### 5. Event readiness
- Go/no-go checklist 1 week out: pipelines green 7 consecutive days, SMTP
  volumes tested, push certificates valid past event dates, on-call rota,
  venue wifi contingency (offline shell + staff QR desk works without
  attendee connectivity).
- Runbook walkthrough #2 with the full events team; print the QR check-in
  posters (Sprint 7 generator).
- Post-event plan stub: data export for REGROWTH, survey push, sunset/reuse
  decision for next year (multi-event support remains the known phase-3 item).

## Definition of Done
- [ ] TestFlight external build in pilots' hands; OTA path proven
- [ ] All ten §10 checks pass on hardware, recorded
- [ ] Scale test passed; cap/priority + RLS suites running in CI
- [ ] Two UAT cycles closed; crash-free ≥ 99.5 %
- [ ] Go/no-go review held with REGROWTH; event-week rota agreed
