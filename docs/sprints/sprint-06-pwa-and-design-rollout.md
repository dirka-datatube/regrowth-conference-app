# Sprint 06 — PWA delivery & design rollout

**Status:** in progress
**Opened:** 2026-08-18
**Supersedes:** the native-only assumptions in sprints 01–05. Those sprints stay
valid for backend, content pipeline, connections and hardening. The "App Store /
TestFlight / EAS" tasks in them are **back in scope** — the hybrid wrapper was
bought on 2026-08-19 — but they now ship *after* the web surface rather than
gating go-live.

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

### 4.9 Native wrapper — config landed, build not yet run
Bought 2026-08-19. What landed: `NSMicrophoneUsageDescription`,
**`UIBackgroundModes: ["audio"]`** (the entitlement that lets recording survive
a locked screen — the whole reason for the purchase), `remote-notification`,
Android `RECORD_AUDIO` / `FOREGROUND_SERVICE_MICROPHONE` / `POST_NOTIFICATIONS`,
the `expo-av` dependency and plugin, and `eas.json` with development/preview/
production profiles.
**Acceptance:** `eas build --profile preview` produces an installable iOS build;
`Audio.setAudioModeAsync({ staysActiveInBackground: true })` is set at runtime;
a recording started in-app survives locking the screen for ten minutes.
**Blocked on:** the Apple Developer account, and a real EAS project id —
`app.json` still carries `REPLACE_WITH_EAS_PROJECT_ID`.

### 4.10 Two-surface messaging
`/get-the-app` explains what each surface gives you; the Insights capture menu
badges voice/video as "App" in the browser and routes there rather than hiding
them.
**Acceptance:** `NATIVE_APP.ios` / `.android` are populated once the listings
exist, so the page offers a real link instead of "not released yet".

### 4.8 Delete or gate the drawer
`app/menu.tsx` is the old twelve-item drawer. Its destinations now live under
Connect and Me. Decide whether it survives.

---

## 5. Out of scope

- Submitting to the App Store / Play Store. The wrapper is bought and the
  config landed (§4.9), but store submission needs the Apple Developer account,
  which is still an unresolved external dependency.
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
3. ~~Does the hybrid native wrapper get bought?~~ **Yes — push and recording
   are wanted.** Platform config landed (§4.9); the recording implementation
   itself is §4.4.

**Still open**

3. Is "Beyond Events" (Courses, Workshops & Programs) in scope? It is in the
   design and in no version of the spec. The Events screen currently routes it
   at `/solutions` as a placeholder.
4. Where do Polls & Surveys live, now that six tabs are fixed?
5. **Does go-live on 16 Nov mean the web surface only?** Buying the wrapper
   restores App Store review to the critical path, and the last working day
   (Fri 13 Nov) is three days before go-live. Recommendation: ship the PWA on
   16 Nov, follow with the app once review clears.
6. Who owns the Apple Developer account? Still unresolved, and now blocking.
