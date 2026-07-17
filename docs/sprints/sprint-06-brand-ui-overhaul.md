# Sprint 6 — Brand UI/UX overhaul (the big one)

**Goal:** the app *looks and feels like REGROWTH®* — clean, warm, premium,
photography-forward — and is effortless to navigate. This is the flagship
sprint of phase two: every screen gets designed, not just themed.

**Duration:** ~3 weeks (1.5× normal — this is the big one)
**Requires:** Sprints 1–5 execution run (done 2026-07-17)
**Blocked by (human):** brand guidelines PDF loaded into the repo (`docs/brand/`)

---

## Context for the agent

The current UI is a functional dark scaffold (Midnight background, Snow
type) built from the original build-prompt palette. **Real REGROWTH
collateral tells a different story** — see the email screenshots the team
shared (to be committed under `docs/brand/reference/`): predominantly
**light** layouts — white/Cloud surfaces, Midnight navy serif headings,
Earth (terracotta) buttons, Ocean teal accent blocks, the circled RG
monogram, generous whitespace, large photography, script flourishes used
sparingly.

Read first: `tailwind.config.js`, `components/` (Type, Card, Button,
Screen), `app/(tabs)/*`, `app/menu.tsx`, and the brand PDF when loaded.

## Design direction (confirm against the PDF, then commit)

1. **Light-first.** Snow/Cloud surfaces, Midnight for type and hero moments,
   Earth for CTAs, Ocean for informational accents. Dark Midnight retained
   for "moment" screens (welcome, session-live view, QR display) where drama
   helps. Decision logged in ROADMAP once ratified with Kylie.
2. **Typography hierarchy that reads premium:** serif display headings
   (Butler if licensed by then, else New York/Georgia tuned), uppercase
   letter-spaced sans sub-labels, script only for one flourish per journey.
3. **Photography-forward:** speaker headshots, venue imagery, and partner
   logos treated as first-class content — full-bleed hero cards, soft radii,
   no grey placeholder boxes (branded monogram placeholders instead).
4. **The RG monogram** as app icon, splash, loading state, and QR badge.

## Tasks

### 1. Design tokens v2 + theme plumbing
- Rework `tailwind.config.js` into semantic tokens (`surface`, `surface-alt`,
  `ink`, `ink-muted`, `cta`, `accent`, `line`) so screens never hard-code
  palette names again; map tokens to the light scheme.
- Rebuild `components/` primitives on the tokens: Screen (light status bar
  handling), Type scale, Button (Earth pill, secondary Ocean, quiet ghost),
  Card variants (photo card, list row, stat chip), Header (back + title),
  branded empty/loading/error components with the monogram.
- App icon + splash from the monogram (Midnight on Snow), notification icon.

### 2. Navigation simplification
Current: 4 tabs + a 12-item flat menu. Target: **nothing important more than
two taps away, and the menu never feels like a junk drawer.**
- Tabs: **Home · Agenda · Connect · More** (Alerts folds into Home header
  bell with badge; Notes lives inside Agenda/session flows + More).
- "Connect" tab = directory + connection hub + my QR in one place (this is
  the event's social heart — promote it from the menu).
- "More" = grouped sections: *Experience* (Dining, Auction, Gallery),
  *Learn* (Speakers, Podcast, Solutions), *Support* (FAQs, CommBank, Ask a
  question, Profile). Speakers also reachable from every session card.
- Home screen v2: greeting block (script flourish), "happening now / up
  next" timeline strip, people-to-meet carousel, partner spotlight card,
  check-in state chip in the header — ruthless about hierarchy: one scroll,
  no dead sections (hide empties).

### 3. Screen-by-screen redesign
Every screen re-laid on the new primitives (order: tabs → session/speaker/
attendee details → connect flows → auction/dining/gallery → menu pages →
auth). Each screen must ship with: designed empty state, loading skeleton,
error state, and correct ® usage (first wordmark per screen).

### 4. Motion & feel
- `react-native-reanimated` micro-interactions: pressable scale on cards,
  tab cross-fade, skeleton shimmer, pull-to-refresh with monogram spinner,
  check-in success moment (one tasteful celebration animation).
- Haptics on: check-in, connection made, bid placed, question submitted.

### 5. Accessibility + brand QA gate
- VoiceOver labels on all interactive elements; dynamic type doesn't break
  layouts; WCAG AA contrast (test Earth-on-Snow at small sizes — darken the
  token if needed, not per-screen hacks).
- Voice pass on every string ("we", solutions-focused, REGROWTH capitalised).
- Deliverable: screenshot gallery of every screen (light + the retained dark
  moments) committed to `docs/brand/screens/` for Kylie's sign-off.

## Out of scope
New features, backend changes (tokens/UI only), Android-specific polish.

## Definition of Done
- [ ] Brand PDF ratified direction; light-first tokens merged
- [ ] All screens on the new system — zero legacy dark-scaffold screens left
- [ ] Navigation: 4 new tabs, grouped More, Alerts→bell, two-tap rule verified
- [ ] Empty/loading/error designed on every screen; motion + haptics in
- [ ] Accessibility + voice QA pass complete
- [ ] Screenshot gallery approved by REGROWTH (Kylie sign-off recorded)
