# Sprint 07 — Design system v2 and registration-aware tabs

**Dates:** Friday 25 Sep – Thursday 1 Oct 2026
**Epic:** [`EPIC-DESIGN-V2.md`](../EPIC-DESIGN-V2.md) · **Review:** [`DESIGN-REVIEW-2026-09.md`](../DESIGN-REVIEW-2026-09.md)
**Branch:** `claude/figma-design-review-vptxlu` (PR #5)

## Goal

The six tab roots match the Figma v2 comps, in both the **registered** and
**unregistered** states, with the state driven by data rather than hard-coded.

## Why this sprint comes first

Every later sprint renders inside these tabs and reuses these components. The
registration state in particular is the product rule the rest of the design
hangs off. This sprint builds it as a *read model* with a stable interface, so
Sprint 08 can replace the data underneath without touching a screen.

## Figma budget

Starter plan: 20 reads a month. This sprint spends **five**:

| Read | Node | Used for |
| --- | --- | --- |
| Home — registered | `132:598` | Hero, quick access, featured, need help, continue learning, support chip, tab bar |
| Events — registered | `134:819` | Announcement banner, ticket card |
| Alerts | `71:540` | Alert cards, toggle, modal |
| Connect | `92:212` | Feature cards, locked community buttons |
| Profile | `34:1423` | Profile card, badge card, menu rows |

My Tickets is built from its screenshot, since it is composed entirely of the
badge card from Profile.

## Tasks

### 07.1 Tokens v2 and the floating tab bar
Add the alert semantic colours (confirmation, action required, welcome,
reminder), the teal CTA, and the cloud card surface to `tailwind.config.js`. Rework
`components/TabBar.tsx` to float — inset from the screen edges and rounded on
every corner.
**Acceptance:** no hex literals in screens for any colour the design names.

### 07.2 Registration read model
Migration adding `ticket_tier` and `registration_status` to `attendees`, plus a
`useRegistrations()` hook returning `{ eventId, ticketTier, status, qrToken }[]`
and `isRegisteredFor(eventId)`.

The current schema has `attendees.user_id unique`, so a real user can hold **one**
registration until Sprint 08 splits `profiles` from `registrations`. The hook
returns an array regardless, so no screen changes when that lands.
**Acceptance:** every registered/unregistered branch in the UI goes through the
hook.

### 07.3 Real QR codes
Replace the placeholder in `components/QrModal.tsx` — open since July — with a
rendered code. QR payloads are **URLs** (`<APP_URL>/c/<token>`), so a phone's
own camera app can scan them. This is the approach the August gap analysis
recommended for PWA check-in.
**Acceptance:** a badge QR decodes to the attendee's URL in an automated test.

### 07.4 Shared components
Event hero, quick access grid, featured carousel, need-help card,
continue-learning card, support chip, announcement banner, badge card, alert
card, feature card, profile summary card, menu row.

### 07.5 Home
`app/(tabs)/index.tsx` rebuilt to `3:1921` / `132:598`: greeting, search, featured
event hero, quick access, featured carousel, need help, continue learning.

### 07.6 Events
`app/(tabs)/events.tsx` rebuilt to `129:420` / `134:819`. The August carousel and
*Beyond Events* row are removed — the comp replaced them. Registered users get
the ticket card; unregistered users get the registrations-open banner.

### 07.7 Alerts
`app/(tabs)/alerts.tsx` rebuilt to `71:540`: typed, colour-coded cards, the global
toggle, and the countdown modal.

### 07.8 Connect
`app/(tabs)/connect.tsx` rebuilt to `92:212` / `137:1261`: four photo feature cards.
Community buttons lock per event unless registered for it.

### 07.9 Profile and My Tickets
`app/(tabs)/me.tsx` rebuilt to `34:1423`: profile card, entry badge, seven-row
menu. New `app/tickets.tsx` to `146:1906`: one badge per registration.

### 07.10 Demo mode
Demo shows both states (`?registered=0` for the unregistered view), and
`EXPO_PUBLIC_DEMO_MODE` works under `expo export` — Sprint 06 verification had to
hard-code it.

## Definition of done

- Home, Events, Alerts, Connect and Profile match their comps in both states;
  Insights is unchanged; My Tickets exists
- `npm run build:web` passes, and the demo export boots into the tabs with no
  code edits
- Chromium smoke test at 402×874 covers every tab in both states with zero
  console errors
- `tsc` at or below the 92-error baseline; `eslint` at zero errors
- The badge QR decodes to the expected URL

## Out of scope

- Auth screens and the account model — Sprint 08
- More than one real registration per user — Sprint 08 (the schema forbids it)
- Stripe and real ticket issuance — Sprint 09
- The event sub-app behind ACCESS EVENT — Sprint 10
- Profile menu destinations — Sprint 11; rows route to existing screens where
  they exist
- Real icons, logo and imagery — Sprint 12 (`figma.com` is network-blocked here)
