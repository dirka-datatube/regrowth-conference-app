# Epic — Implement the Event App design (Figma v2)

**Opened:** 2026-09-25
**Design of record:** Figma `NEW: Event App` (`A8G0Lx1Uflhrl4uaqB2QLV`)
**Review this plan is built on:** [`DESIGN-REVIEW-2026-09.md`](DESIGN-REVIEW-2026-09.md)
**Go-live:** Monday 16 November 2026 · **Event:** Navigate 2027, 15–17 March 2027

## Outcome

Every screen in the Figma file is built to its comp, backed by real data, on the
PWA — and the native wrapper ships for the two things a browser cannot do.

## The shape of the plan

The design dates Navigate at **15–17 March 2027**, so the 16 November go-live is
a *pre-event* launch. That splits the epic into two phases:

| Phase | By | What it delivers |
| --- | --- | --- |
| **1 — Launch-ready** | 16 Nov 2026 | Accounts, registration state, tickets and QR, the six tabs, the event sub-app as information, Connect and Profile content |
| **2 — Event-ready** | 15 Mar 2027 | Recording and live transcription, the native app through App Store review, live support chat, on-site check-in, live alerts |

This takes App Store review off the November critical path — the open risk from
the hybrid-wrapper decision.

Sprints are one week, bounded by the Friday working days in the SOW. Sprint 12
is two weeks and ends at the 13 November go/no-go.

---

## Phase 1 — launch-ready by 16 November

### Sprint 07 — Design system v2 and registration-aware tabs
**25 Sep – 1 Oct** · full brief: [`sprints/sprint-07-design-v2-core-tabs.md`](sprints/sprint-07-design-v2-core-tabs.md) ·
**built 25 Sep** — see the brief's *Delivered* section

The six tab roots match the new comps, in both registered and unregistered
states.

- Tokens v2 and the tab bar's Profile tab
- Registration read model — `useRegistrations()`, ticket tier and status — the
  seam Sprint 08 refactors underneath
- Real QR rendering (fixes the July placeholder defect), URL-encoded tokens
- Shared components: event hero, quick access grid, featured carousel, need-help
  card, continue-learning card, support chip, announcement banner, badge card,
  alert card, feature card
- Home, Events, Alerts, Connect, Profile rebuilt to comp; My Tickets built
- Demo mode switches between registered and unregistered, and works under export

**Done when** all six tabs match their comps in both states, and the web build
and a browser smoke test pass.

### Sprint 08 — Accounts and the registration model
**2 – 8 Oct** · **blocked on Decision 1**

Anyone can create an account; registration is what unlocks an event.

- Welcome, Log in, Sign up and Forgot password built to comp (email + password)
- Replace the reject-unknown-email auth trigger with profile creation
- Split the person (`profiles`) from the registration (`registrations`: event,
  tier, status, QR, payment refs) and migrate `attendees`
- RLS: unregistered accounts read public content only; the attendee directory and
  communities are gated per registration
- Fix the ActiveCampaign de-duplication defect — identity on email
- Profile completion: role, office, office address, catering, photo

**Done when** a new user can sign up and sees the unregistered state, a
registration flips them to registered, and an RLS test proves an unregistered
user cannot read attendees.

### Sprint 09 — The registration commerce loop
**9 – 15 Oct**

Paying on the website puts a ticket in the app.

- Stripe webhook → registration with ticket tier (idempotent)
- ActiveCampaign upsert: search by email, create or update, apply the three tag
  families (metro/regional, previous/first-timer, EDM opt-ins)
- Post-payment email with the app link, via an AC automation
- Discount codes and early-bird as Stripe Promotion Codes
- My Tickets reads real registrations; ticket download (**Decision 7**)
- Squarespace checkout shape

**Done when** a test-mode checkout produces a registration, an AC contact and a
visible ticket within 30 seconds, and a replayed webhook creates nothing new.

### Sprint 10 — The event sub-app
**16 – 22 Oct**

Navigate and the Study Tour each get a complete information experience from one
parameterised flow — their frames are structurally identical.

- Event route group and event context
- Event home: countdown, quick access, View My QR, featured speakers, *What's
  Coming* feed, info cards
- Agenda with typed sessions and search; session detail; saved sessions
- Speakers and speaker profile
- Hotel & accommodation, What to Pack (checklist), Weather (Open-Meteo — no key)
- Venue map: level switcher and quick directory
- Content model for accommodation, packing lists, map levels, announcements

**Done when** both events render every screen from database content, and ACCESS
EVENT on the hero lands on the right event home.

### Sprint 11 — Connect and Profile content
**23 – 29 Oct**

Every Profile menu row and Connect card lands on a screen built to comp.

- Community attendees per event (gated); networking connections with empty state
- Scan QR — in-app scanner plus Upload From Gallery decoding
- Podcast, Partners, partner detail
- REGROWTH Services, Templates & Resources
- App Settings, Rate App, Privacy, Terms, Contact
- Find a Referral — built once defined (**Decision 5**)

### Sprint 12 — Hardening and launch
**30 Oct – 13 Nov** · go/no-go Friday 13 November · go-live Monday 16 November

- Real assets — icons, RG logo, imagery (export outside this environment)
- Fonts — Poppins, Inter, Butler (licensing)
- Real content — dates, venue (**Decision 2**), speakers, sessions, partners
- Security — edge functions derive identity from the JWT; advisor pass
- Deploy the PWA — hosting, `app.regrowth.au`, HTTPS
- CI — typecheck, lint and web build on every PR
- UAT with Kylie's team

**Done when** the production URL is live and a new user can sign up, register
through a test checkout, and see their ticket.

---

## Phase 2 — event-ready by 15 March

Outlined now; full briefs are written as Phase 1 lands, because the design is
still moving.

### Sprint 13 — Insights capture and AI · *Nov – Dec*
Create Note and Audio Recording to comp; header mic and camera capture;
recording with background capture on native and a foreground caveat on the web;
live transcription (**Decision 4**); AI summaries gated to two events; pin and
Recently Viewed wired. Native wrapper through EAS, TestFlight and App Store
review.

### Sprint 14 — On-site and live · *Jan*
Customer support chat with a staff inbox (**Decision 3**); door check-in with
real duplicate feedback; sponsor booth check-in; live alerts with web push and
native push fan-out; countdown modal triggers.

### Sprint 15 — Event readiness · *Feb – 15 Mar*
Event content load; on-site UAT at the venue; polls and surveys if designed
(**Decision 6**); analytics; load test; event-day runbook.

---

## Decisions

| # | Decision | Blocks | Recommendation |
| --- | --- | --- | --- |
| 1 | **Auth model** — email + password with open sign-up, as designed, replacing magic links and the pre-registered-only rule? | S08 | Adopt the design. Supabase supports both; keep magic links as a fallback sign-in |
| 2 | **Navigate 2027 venue** — the comps say Moscone, Sofitel Wentworth and "Crown" | S12 | Confirm with Kylie; the repo seeds Crown Towers Perth |
| 3 | **Support chat** — real in-app chat with a staff inbox, or a WhatsApp / email link for v1? | S14 | Link-out for launch; real chat for the event |
| 4 | **Speech-to-text provider** for live transcription | S13 | Choose on cost per hour of audio |
| 5 | **Find a Referral** — what is it, and who supplies referrals? | S11 | Needs a product definition before any build |
| 6 | **Polls & surveys** — still undesigned | S15 | Ask the designer for a frame |
| 7 | **Ticket download** — image, PDF, or Apple/Google Wallet pass? | S09 | Image for launch; Wallet pass with the native app |
| 8 | **SOW v3** — is this scope contracted? | All | Confirm before Sprint 08 starts |

## External dependencies

- **Figma MCP budget.** The Starter plan allows **20 reads a month**. Building 54
  screens to comp needs at least one design-context read each. Upgrading to a
  Professional plan with a Full or Dev seat raises this to 200 a day and removes
  the ceiling from the critical path.
- **Figma asset export.** This environment's network policy blocks `figma.com`,
  so icons, the logo and imagery must be exported outside it.
- Stripe account and products; ActiveCampaign credentials and list IDs
- Apple Developer account (Sprint 13)
- Font licences (Sprint 12)
