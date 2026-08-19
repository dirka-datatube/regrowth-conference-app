# Sprint 06 — PWA delivery & design rollout

**Status:** in progress
**Opened:** 2026-08-18
**Supersedes:** the native-app assumptions in sprints 01–05. Those sprints stay
valid for backend, content pipeline, connections and hardening; every "App
Store / TestFlight / EAS" task in them is now out of scope unless the hybrid
wrapper is bought (see §5).

---

## 1. Why this sprint exists

Two decisions landed together:

1. **Delivery is a PWA, not a native iOS app.** (2026-08-18, client.) The App
   Store download was the stated barrier to entry.
2. **The Figma file is the design of record** — `NEW: Event App`,
   file `A8G0Lx1Uflhrl4uaqB2QLV`. It resolves the IA that spec v3 left open.

Together they change the shape of the app: a new six-tab information
architecture, a glassmorphic visual language, and a delivery target where push
notifications and background audio capture behave differently.

---

## 2. What the design settles

| Question | Answer from the file |
| --- | --- |
| What is "Insights"? | The event **notes** library — All / Recently Viewed / Pinned, search with voice input, note cards tagged by event with Important + Reminder flags and a pin. |
| How many bottom tabs? | **Six**: Home · Alerts · Events · Insights · Connect · Me. |
| What happened to Feedback? | **Dropped.** Polls & Surveys have no home in the design. **Resolved 2026-08-19: six tabs stand.** When polling is built it needs a non-tab home, not a seventh tab. |
| Where does the "+" go? | Bottom-right of Insights. Spec v3 supersedes the plain "+" with camera/video + mic capture. |

It also raises three things nobody has priced:

- ~~**"NAVIGATE 2027"** vs the repo's seeded 2026 event.~~ **Resolved
  2026-08-19: 2027 is correct.** Migration `20260819000000` renames the live
  event and adds the Study Tour as the second product.
- **"Beyond Events — Courses, Workshops & Programs"**, a third product category
  beyond Navigate and the Study Tour.
- A **Customer Support screen** that appears in no version of the spec.

---

## 3. Done in this sprint so far

| Area | What landed |
| --- | --- |
| Design tokens | `tailwind.config.js` carries the design's palette (`accent #539DF3`, glass surfaces, chip fills, `#B9C0C9` indicator), radii and type scale alongside the print brand palette. |
| Glass primitives | `components/Glass.tsx` (`GlassPanel`), `Chip`, `SearchField`, `Fab`, `ScreenHeader`, `TabBar`. |
| IA | Six-tab layout. `agenda` moved out of the tab bar to `/agenda`; the old `notes` tab is replaced by `insights`. |
| Insights | Built to the comp — filters, search + mic, glass note cards with tag/important/reminder meta, pin, capture FAB. |
| Events | Built to the comp — welcome copy, snapping event carousel, Get Started, Beyond Events row. |
| Connect / Me | Built in the design language (their Figma frames are empty shells). `Me` lists CPD records and event resources as visibly disabled rather than hiding the gap. |
| Schema | `20260818000000_insights_notes.sql` — notes gain `title`, `event_id`, `pinned`, `important`, `reminder_at`, with backfills and indexes. `20260819000000_navigate_2027_and_study_tour.sql` — renames the live event to **Navigate 2027** and inserts **REGROWTH Study Tour 2027** as the second product. |
| PWA | `public/manifest.json`, `public/sw.js` (shell + asset caching, web push, notification click-through), `lib/pwa.ts`, `components/InstallPrompt.tsx`, `scripts/pwa-head.mjs`, `npm run build:web`. |
| Capability gating | `lib/capture.ts` — `canRecordInBackground()`, `isInstalledPwa()`, `isInAppBrowser()`. The capture menu hides what the host cannot do. |
| Build fixes | NativeWind pinned to `4.1.23` (4.2.6's babel preset requires reanimated 4 and broke the web build); `reanimated: false` on `babel-preset-expo`; web output switched to `single`; placeholder app icons generated. |

**Verified:** `npm run build:web` produces an installable bundle (manifest, service
worker, icons, iOS standalone meta). Smoke-tested in Chromium at 402×874 — all
six tabs render and navigate, zero console errors. `tsc` adds no new errors over
the 92-error baseline; `eslint` is clean.

---

## 4. Remaining tasks

### 4.1 Assets — blocked on export
The build environment's network policy blocks `figma.com`, so **no design asset
could be downloaded**. Every icon is an Ionicons stand-in and every app icon is
a generated placeholder. `assets/README.md` carries the node-id → destination
manifest.
**Acceptance:** the manifest table is empty; no Ionicons remain in `TabBar`,
`SearchField`, `ScreenHeader`, `Fab`, or the Insights meta row.

### 4.2 Wire the pin
`NoteCard` renders `onTogglePin` but Insights passes nothing, so hearts are
display-only.
**Acceptance:** tapping a heart writes `notes.pinned` and the Pinned filter
reflects it after a refetch.

### 4.3 Real "Recently Viewed"
Currently a `slice(0, 5)` of the newest notes.
**Acceptance:** a `note_views` table (or a `last_viewed_at` column) backs the
filter; opening a note updates it.

### 4.4 Capture flows
The FAB routes to `/notes/new?capture=…` but nothing consumes the parameter.
**Acceptance:** photo capture uses `<input capture>` on web; voice recording
warns before starting on a host where `canRecordInBackground()` is
`'foreground'`, and is hidden entirely where it is `'unsupported'`.

### 4.5 Web push end to end
`sw.js` handles `push` and `notificationclick`; nothing subscribes yet.
`lib/push.ts` is still Expo Push (native).
**Acceptance:** VAPID keys configured; an installed PWA receives a session
reminder; `send-push` fans out to web subscriptions as well as Expo tokens.

### 4.6 Restyle Home and Alerts
Both still use the pre-design layout. The Figma Home frames are empty, so this
needs either a comp or a decision to extend the established language.

### 4.7 Fix demo mode under export
`EXPO_PUBLIC_DEMO_MODE` is not inlined by `expo export` the way it is by
`expo start`, so the exported demo build lands on the auth screen. Verification
in this sprint required temporarily hardcoding `IS_DEMO`.
**Acceptance:** `npm run build:web` with the flag set produces a bundle that
boots straight into the tabs.

### 4.8 Delete or gate the drawer
`app/menu.tsx` is the old twelve-item drawer. Its destinations now live under
Connect and Me. Decide whether it survives.

---

## 5. Out of scope

- Native wrapper, EAS, TestFlight, App Store. Only in scope if the hybrid
  option in `docs/SPEC-V3-GAP-ANALYSIS.md` §4 is bought.
- Stripe, discount codes, refer-a-friend, Squarespace.
- Polls & surveys. Six tabs are now fixed, so these need a non-tab home
  (under a session, or under Events) before they can be built.
- Sponsor booth check-in, gamification, analytics dashboard, CPD, booklets,
  past-event video.
- Study Tour as a fully separate product. The Events carousel lists it; none of
  the downstream screens are scoped per-product yet.

---

## 6. Decisions

**Resolved 2026-08-19**

1. ~~Six tabs, or fold Feedback in?~~ **Six tabs stand.** Polls & Surveys will
   need a non-tab home when they are built.
2. ~~Navigate 2027 or 2026 for v1?~~ **2027.** Applied in migration
   `20260819000000`, `seed.sql` and the demo fixtures.

**Still open**

3. Is "Beyond Events" (Courses, Workshops & Programs) in scope? It is in the
   design and in no version of the spec. The Events screen currently routes it
   at `/solutions` as a placeholder.
4. Does the hybrid native wrapper get bought — i.e. do we keep push
   notifications and background audio recording? This is the expensive one and
   it still blocks AI note-taking, which is a confirmed deliverable.
5. Where do Polls & Surveys live, now that six tabs are fixed?
