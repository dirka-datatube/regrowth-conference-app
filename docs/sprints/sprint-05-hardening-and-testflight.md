# Sprint 5 — Hardening, polish & TestFlight launch

**Goal:** the app is secure, observable, brand-finished, and in the hands of
REGROWTH staff and pilot attendees via TestFlight — with an event-day runbook
so the team can operate it without engineering on speed-dial.

**Duration:** ~2 weeks · **Requires:** Sprints 1–4 done
**Spec DoD covered:** full §10 checklist re-verified end-to-end


> **Progress 2026-07-17:** Executed in the autonomous sprint run — see
> [`docs/reports/2026-07-17-sprint-execution.md`](../reports/2026-07-17-sprint-execution.md)
> for what shipped, verification evidence, and the remaining device/human-bound
> items for this sprint.

---

## Context for the agent

This sprint is audit + polish + launch, not features. Bias toward deleting
risk, not adding surface. Read first: `docs/ROADMAP.md` defect list (whatever
remains), Supabase advisors output, the spec's §1 brand rules and §10 DoD.

## Prerequisites

- [ ] TestFlight app record created under Kylie's Apple Developer account
- [ ] Final content loaded (agenda, speakers, partners, FAQs, CommBank copy signed off)
- [ ] Pilot tester list (staff + a few friendly attendees)
- [ ] PostHog + Sentry accounts/DSNs

## Tasks

### 1. Security audit

- Run Supabase advisors (security + performance); fix every security finding,
  document any accepted risk.
- RLS test suite: SQL tests (or pgTAP) asserting — attendee A cannot read
  B's notes/picks/connections; hidden attendees invisible; anonymous question
  authorship never selectable; unauthenticated role sees nothing.
- Edge functions: confirm every function derives identity from JWT (Sprints
  3–4 fixed the known ones — sweep the rest: `check-in`, `ac-event-emit`
  currently trust body IDs). Add basic rate limiting (per-IP/user counters)
  on OCR and suggestions (they spend Anthropic tokens).
- Secrets sweep: nothing sensitive in the bundle (`npx expo export` + grep),
  demo mode hard-excluded from the production profile (build-time guard that
  throws, not just a warning).
- Rotate any key that was ever pasted into a chat/laptop during development.

### 2. Observability

- Sentry: release + sourcemaps wired into EAS builds; alert rule → email/Slack.
- PostHog: screen views, key funnels (login success rate, connection scans,
  bids, notes-to-summary conversion), one dashboard for event week.
- Edge function logging: structured logs + a `get_logs` check runbook entry;
  cron-job failure alerting (a daily "pipelines healthy" query).
- Admin **Reports** section (spec §4): check-ins by day, top sessions by
  picks, partner leads table (exportable CSV), questions volume.

### 3. Performance & resilience

- Lists: verify FlatList/virtualisation on attendees (200+) and agenda;
  paginate attendee directory queries.
- Images: Supabase Storage transform URLs (width params) for headshots/logos;
  cache headers.
- Cold start: measure; lazy-load heavy routes if > 3 s on an older device.
- Offline pass under real conditions (venue wifi flakiness simulation:
  airplane-mode toggles mid-session; ensure no crash loops, queries retry).
- Event-scale smoke test: seed ~500 attendees, 60 sessions; realtime channels
  and Home queries stay responsive.

### 4. Brand & UX polish

- Screen-by-screen pass against the brand PDF: palette usage, Butler/Northwell
  hierarchy, ® on first wordmark use per screen, voice review of every string
  ("we", solutions-focused).
- Accessibility: VoiceOver labels on interactive elements, dynamic type
  doesn't break layouts, contrast check (Earth on Midnight is borderline for
  small text — verify WCAG AA, adjust size/weight where needed).
- Empty/error/loading states audit — every screen has all three, on-brand.
- App icon + splash finalised from brand assets.

### 5. App Store readiness & TestFlight

- Privacy: `PrivacyInfo.xcprivacy` manifest, App Store privacy nutrition
  labels (camera, location, contacts-adjacent data), consent copy for
  photos/directory visibility (ties to the brief's consent-wording question —
  chase sign-off).
- `production` EAS build → TestFlight internal, then external group with the
  pilot list; crash-free session target ≥ 99.5 % before widening.
- UAT script for Kylie's team covering all §10 items; collect via a shared
  doc; triage → fix → rebuild loop (budget ~3 days for two cycles).

### 6. Event-day runbook (`docs/runbook.md`)

Write it for a non-engineer with an engineer on call:

- Morning checks: pipelines green, push test to staff segment, check-in scanner test
- How to: send an announcement, fix a room change, moderate Q&A surge,
  close auction items, re-run a failed sync
- Failure modes: Supabase incident, push outage (fallback: announcement via
  AC email), what "demo mode" is and why it must never be on
- Contacts + escalation order

## Out of scope

New features of any kind. Android release. Multi-event support. Phase-2
gamification.

## Definition of Done

- [ ] Advisors clean (or risks documented + accepted in writing)
- [ ] RLS test suite in CI; JWT-derivation sweep complete
- [ ] Sentry + PostHog live with dashboards; reports section shipped
- [ ] Perf targets met at 500-attendee scale; offline resilient
- [ ] Brand/accessibility pass signed off by REGROWTH
- [ ] TestFlight external build in pilots' hands; UAT cycle complete
- [ ] Full spec §10 checklist re-verified and recorded (video walkthrough)
- [ ] `docs/runbook.md` delivered and walked through with Kylie's team
