# Assets

## ⚠️ Icons and imagery are placeholders

The app icons in this folder and in `public/icons/` were generated
programmatically (brand midnight ground + an earth-coloured ring). **They are
not the REGROWTH logo.** They exist so the app builds and installs; they must
be replaced before anything reaches an attendee.

Geometry is already correct — the maskable icon carries the 20% safe padding
Android needs — so dropping the real artwork in at the same sizes will not
reflow anything.

| File | Size | Used by |
| --- | --- | --- |
| `assets/icon.png` | 1024² | Expo app icon |
| `assets/adaptive-icon.png` | 1024², 20% pad | Android adaptive icon |
| `assets/splash.png` | 1284×2778 | Splash screen |
| `assets/favicon.png` | 48² | Expo web favicon |
| `assets/notification-icon.png` | 96² | Push notification icon |
| `public/icons/icon-192.png` | 192² | PWA manifest |
| `public/icons/icon-512.png` | 512² | PWA manifest |
| `public/icons/icon-maskable-512.png` | 512², 20% pad | PWA maskable |
| `public/icons/apple-touch-icon.png` | 180² | iOS home screen |

---

## Figma icon manifest — not yet exported

The design (`NEW: Event App`, file `A8G0Lx1Uflhrl4uaqB2QLV`) ships its own icon
set. **These could not be downloaded from the build environment — its network
policy blocks `figma.com`** — so the UI currently renders Ionicons stand-ins.

Each row below is a real exported asset that should replace a stand-in. Export
from Figma at 3×, drop into `assets/icons/`, and swap the `ICONS` map in
`components/TabBar.tsx` plus the `Ionicons` calls in the screens noted.

| Figma layer | Node id | Currently rendered as | Where |
| --- | --- | --- | --- |
| `li:home` | `80:1894` | `home-outline` | `components/TabBar.tsx` |
| `Urgent Message` | `80:1901` | `mail-outline` | `components/TabBar.tsx` (Alerts) |
| `Planner` | `80:1904` | `calendar-outline` | `components/TabBar.tsx` (Events) |
| `Light` | `80:1905` | `bulb-outline` | `components/TabBar.tsx` (Insights) |
| `Crowd` | `80:1906` | `people-outline` | `components/TabBar.tsx` (Connect) |
| `Avatar` | `80:1908` | attendee photo / `person` | `components/TabBar.tsx` (Me) |
| `Tag` | `93:1272` | `pricetag-outline` | `app/(tabs)/insights.tsx` meta row |
| `Sorting` | `93:1321` | `filter-outline` | `app/(tabs)/insights.tsx` — "Important" |
| `Alarm` | `93:1322` | `alarm-outline` | `app/(tabs)/insights.tsx` — "Reminder" |
| `Heart` (filled) | `94:2240` | `heart` | `app/(tabs)/insights.tsx` pin |
| `Heart` (outline) | `94:2241` | `heart-outline` | `app/(tabs)/insights.tsx` pin |
| `Back` | `92:580` | `chevron-back` | `components/ScreenHeader.tsx` |
| `Icon / magnifyingglass` | `I92:684;140:9380` | `search` | `components/SearchField.tsx` |
| `SF Symbol / microphone` | `I92:684;140:9337` | `mic-outline` | `components/SearchField.tsx` |
| FAB (`Group 2`) | `94:1765` | `add` on an `earth` circle | `components/Fab.tsx` |

The FAB's exact fill was not recoverable — it is an SVG group, so no hex came
back with the design context. It currently uses the brand `earth` (`#D17F5D`),
which is close to the comp but should be confirmed against the real asset.

### Event hero imagery

`app/(tabs)/events.tsx` renders `event.hero_url` when present and falls back to
a flat panel. The Figma comp uses a photograph from a previous conference —
same story, not exportable from here. Load the real images into the `events`
table (or the `event-media` storage bucket) rather than committing them.

---

## Fonts

See [`fonts/README.md`](fonts/README.md). Licensing for Butler / Northwell Alt /
DIN is deferred; the design additionally specifies **Poppins** (nav labels,
filter chips) and **Inter** (card titles, meta rows), neither of which is
bundled. `tailwind.config.js` maps `font-ui` and `font-data` to system stacks
with comparable metrics so the layout will not shift when they land.
