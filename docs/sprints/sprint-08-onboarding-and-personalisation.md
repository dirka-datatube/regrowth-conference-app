# Sprint 8 — Onboarding & personalisation v2

**Goal:** the first 60 seconds make every attendee feel known ("appreciated,
confident, happy, respected, understood and heard"), and the personalisation
engine has the data it needs to be genuinely useful all week.

**Duration:** ~2 weeks · **Requires:** Sprints 6–7

---

## Tasks

### 1. First-run onboarding (3 screens, skippable, < 60 s)
1. **Welcome** — script flourish, name pre-filled (we never re-ask what we
   know), one line on what the app does for them.
2. **You** — photo (camera/library → `headshots` bucket), interests as
   tappable chips (curated taxonomy below), role confirmation.
3. **Your comfort** — directory visibility (clear plain-English explanation
   of public / connections-only / hidden), notification categories with the
   "max 4 a day, promise" line.
- Completion emits `onboarding_complete` (AC automation already allow-listed).
- Profile-completeness nudge card on Home until photo + ≥3 interests exist.

### 2. Interest taxonomy (unblocks good matching)
- Replace free-text interests with a curated chip set (~20: prospecting,
  recruitment, leadership, PM operations, tech & AI, marketing, wellbeing…)
  agreed with REGROWTH; keep free-text "other".
- Migration: map existing data; admin Attendees page uses the same chips.
- Feed the taxonomy into the `claude-suggestions` prompt (better matches,
  cheaper tokens).

### 3. Home v2 — "your day at a glance"
- Day timeline strip: my next 3 picks (or gentle "build your day" prompt
  into Agenda's picks flow when empty).
- Followed-speaker sessions badged in Agenda and prioritised in "up next".
- "Don't miss this" sweep implemented server-side (the queued notification
  slot already exists): concurrent-session window where the attendee picked
  none → one nudge, wired into `scheduled-tasks`.
- People-to-meet carousel: swipe through today's 3 with rationale lines +
  1-tap "say hello" (opens their profile with a suggested icebreaker line).

### 4. Remaining content features (close the spec)
- **Gallery uploads:** camera-roll picker → `gallery` bucket → `gallery_items`
  (attendee-attributed), pinch-zoom viewer, save/share; admin moderation
  toggle (hide item).
- **Podcast RSS mirror:** `scheduled-tasks` job `podcast_sync` (daily) pulls
  the Impact & Influence feed into `podcast_episodes`; inline player via
  `expo-av`.
- **Notes export:** "email me my notes" through `ac-event-emit`
  (`notes_export`), clipboard copy, and share sheet.

## Out of scope
Gamification/badges (still phase-3), Android, multi-event.

## Definition of Done
- [ ] New attendee: magic link → onboarded (photo, chips, prefs) in < 60 s
- [ ] Interest chips live end-to-end (app, admin, suggestions prompt)
- [ ] Home v2 timeline + carousels; empty states never feel empty
- [ ] "Don't miss this" sweep queueing correctly (test with fixture schedule)
- [ ] Gallery upload, podcast mirror, notes export shipped
- [ ] PostHog funnel: onboarding completion ≥ 80 % in pilot group
