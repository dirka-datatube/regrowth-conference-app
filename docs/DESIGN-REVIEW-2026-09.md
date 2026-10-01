# Design Review — Figma v2 against the build

**Review date:** 2026-09-25
**Design:** Figma `NEW: Event App` (`A8G0Lx1Uflhrl4uaqB2QLV`), page 1
**Build:** branch `claude/figma-design-review-vptxlu` at `47a4413`
**Previous review:** 2026-08-18 (22 frames, 2 fully designed) — see
[`sprints/sprint-06-pwa-and-design-rollout.md`](sprints/sprint-06-pwa-and-design-rollout.md)

The file has grown from 22 frames to **54 screens** (plus two component
frames). In August only Insights and Events were designed; the file is now a
near-complete app. This review maps every screen to its state in the code and
records the product rules the design introduces.

Reviewed visually: Home (both states), Events (both states), Alerts, Connect
(both states), Profile, My Tickets, Insights Audio Recording, Log in, Sign up.
The event sub-app (Navigate Home, Agenda, Speakers, Map, Hotel, Weather) was
reviewed from its layer text. The remaining screens are known by name and
position only; they are scoped here by what their names and the Profile menu
say they are, and each sprint re-reads its own frames before building.

---

## 1. What changed in the design

### The app now has two states: registered and not

Home, Events and Connect each have a `REGISTERED` variant. The rule the design
encodes:

| Surface | Not registered | Registered |
| --- | --- | --- |
| Event hero (Home, Events) | **GET STARTED** | **"You're Registered!"** badge + **ACCESS EVENT** |
| Events tab | Announcement banner: *"Navigate 2027 registrations are now open"* | **VIP PASS** ticket card under the hero |
| Connect → Attendee Networking | Community buttons carry a **lock** | Unlocked, per event |

This is the biggest structural change. Today every signed-in user *is* an
attendee — the auth trigger rejects anyone who isn't pre-registered — so there
is no "not registered" state to render.

### Accounts are open, and use passwords

- **Log in:** Username + Password, *Remember me*, *Forgot your password?*
- **Sign up:** First name, Last name, Phone, Email, Password, Confirm password,
  terms acknowledgement.

The build uses **magic links** and **rejects unknown emails**
(`REGROWTH_UNREGISTERED_EMAIL` in migration `20260101000200`). The design
assumes anyone can create an account and browse, and that *registration*
(paid, on the website) is what unlocks an event.

Sign-up captures first/last name split and phone — two of the spec v3
non-negotiables. The rest (role, office, office address, catering) has no field
here; the Alerts comp has an *"Action Required — Complete Your Profile"* card,
which is where they naturally land.

### Tickets are tiered and multi-event

**My Tickets** ("Fastpass Entry Gateway") holds one badge per registration:
Navigate 2027 → **VIP PASS**, Study Tour 2027 → **VIP DELEGATE**. Each badge
carries a QR, a *VERIFIED BADGE* state and entry instructions. Ticket tiers
imply Stripe products.

The QR itself is still a **placeholder** in the build (`components/QrModal.tsx`
has a TODO) — a known defect since July, now on the critical path.

### Live support is everywhere

A floating **"Jack Garcia — Send us a message"** chip sits above the tab bar on
nearly every screen, and a **Need Help? → Chat with Us** card closes most
screens. The Customer Support frame is a chat UI (name, status, message,
input). This is a real messaging feature with a staff side, not a mailto link.

### Recording shows a live transcript

**Insights Audio Recording** shows a waveform, a running timer
(`00:10:04`), Pause / Stop, and the transcript appearing as the speaker talks
(*"Typing in the background…"*). Background capture is already enabled in the
native wrapper config; live transcription needs a speech-to-text service.

### Smaller changes

- **"Beyond Events" is gone.** Replaced by **Continue Learning → Explore
  Programs** on Home and Events. The unpriced-scope flag from August closes.
- **Events is a single featured event**, not a carousel. The Study Tour gets its
  own Home variant, so the featured event is contextual.
- **Tab bar** keeps its August geometry — full width, 20px radius — and
  relabels the last tab **Profile**, with the avatar inside the selected pill.
  *(Corrected 25 Sep: the first version of this review said the bar floats,
  inset from the screen edges. Every v2 frame draws it full width.)*
- **Quick Access grid** on Home: Alerts, Events, Insights, Connect, Your
  Profile, Weather.
- **Featured carousel** on Home: podcast, leadership resources (PDF), industry
  insights — three content types.
- **Capture moved to headers.** Profile and Create Note carry mic + camera
  buttons in the header — the spec's "camera/video toggle + mic record button".
- **Alerts are typed and colour-coded**: confirmation (teal), action required
  (red), welcome (earth), reminders (gold), plus a global toggle and a
  countdown modal (*"Only 5 Days To Go!"*).
- **Scan QR** has an **Upload From Gallery** fallback — which on the web is a
  file input and a JS decoder, and works on every phone without camera
  permissions.

---

## 2. Coverage — every screen against the build

**Status key:** ✅ matches comp · 🟡 built to the August comp, now stale ·
🟠 exists in the old layout · ⬜ not built

### Onboarding and auth

| Screen | Node | Status | Build / gap |
| --- | --- | --- | --- |
| Phone Screen Display (app icon) | `1:6` | 🟡 | Generated placeholder icon; real "RG" circle logo needed |
| Welcome | `1:3` | 🟠 | `app/(auth)/welcome.tsx` — magic-link copy |
| Log in | `25:260` | ⬜ | Password login does not exist |
| Sign up | `34:767` | ⬜ | Open sign-up is blocked by the auth trigger |

### Tab roots

| Screen | Node | Status | Build / gap |
| --- | --- | --- | --- |
| Home — Navigate | `3:1921` | 🟠 | `app/(tabs)/index.tsx` is the pre-design layout |
| Home — Navigate, registered | `132:598` | ⬜ | No registration state |
| Home — Study Tour (+ registered) | `172:526`, `180:588` | ⬜ | Same components, different featured event |
| Alerts | `71:540` | 🟠 | `app/(tabs)/alerts.tsx` pre-design; no types, toggle or modal |
| Events | `129:420` | 🟡 | Built to the August comp — carousel + Beyond Events now superseded |
| Events — registered | `134:819` | ⬜ | Ticket card |
| Insights | `80:1892` | ✅ | Built to comp in sprint 06 (node unchanged; not re-verified) |
| Connect (+ registered) | `92:212`, `137:1261` | 🟠 | Built as a list in the design language; comp is four photo cards with gated buttons |
| Profile | `34:1423` | 🟠 | `app/(tabs)/me.tsx` in the design language; comp adds badge card + seven-item menu |

### Connect

| Screen | Node | Status | Build / gap |
| --- | --- | --- | --- |
| Attendees — Navigate / Study Tour | `189:540`, `211:660` | 🟠 | `app/attendees/` pre-design, not per-event |
| Scan QR | `237:888` | 🟠 | `ScannerModal` (native camera); no gallery fallback |
| Find a Referral | `206:563` | ⬜ | No product definition or backend |
| Podcast | `206:755` | 🟠 | `app/podcast.tsx` pre-design |
| Partners | `173:720` | 🟠 | `app/partners/` pre-design |
| Partner detail — CommBank | `185:550` | 🟠 | `app/commbank.tsx` pre-design |

### Profile sub-screens

| Screen | Node | Status | Build / gap |
| --- | --- | --- | --- |
| My Tickets | `146:1906` | ⬜ | New |
| Saved Sessions | `216:796` | 🟠 | `schedule_picks` table exists; no screen |
| Networking Connections (+ empty) | `216:1028`, `217:1330` | 🟠 | `app/connections.tsx` pre-design |
| Templates & Resources | `217:1521` | ⬜ | New content type |
| REGROWTH Services | `217:1795` | 🟠 | `app/solutions.tsx` is the same idea, pre-design |
| App Settings (×2) | `220:2103`, `220:2409` | 🟠 | Notification prefs live in `app/profile.tsx` |
| Rate App (+ submitted) | `227:2617`, `227:2741` | ⬜ | New — needs a feedback table |
| Privacy Policy, Terms | `227:2808`, `227:2863` | ⬜ | Static content |
| Contact | `227:2914` | ⬜ | New |
| Customer Support (chat) | `73:453` | ⬜ | Messaging backend + staff inbox |

### Event sub-app — Navigate

| Screen | Node | Status | Build / gap |
| --- | --- | --- | --- |
| Navigate Welcome | `34:1421` | ⬜ | |
| Navigate Home | `146:2498` | ⬜ | Countdown, quick access, View My QR, featured speakers, *What's Coming* feed, accommodation / pack / weather / partner cards |
| Speakers + About | `239:1333`, `239:1501` | 🟠 | `app/speakers/` pre-design |
| Agenda | `92:288` | 🟠 | `app/agenda.tsx` pre-design; comp has typed sessions (KEYNOTE / PANEL / WORKSHOP), speaker chips, search |
| Session detail | `239:1166` | 🟠 | `app/session/[id].tsx` pre-design |
| Venue Map | `92:290` | ⬜ | Level switcher (1–3), quick directory |
| Hotel & Accommodation | `92:289` | ⬜ | |
| What to Pack | `92:292` | ⬜ | |
| Weather | `37:26` | ⬜ | Needs a weather source |

### Event sub-app — Study Tour

| Screen | Node | Status |
| --- | --- | --- |
| Welcome, Home, Agenda, Map, Weather, What to Pack | `34:1422`, `211:872`, `211:1426`, `211:1341`, `211:1273`, `211:1056` | ⬜ |

The Study Tour frames are **structurally identical** to Navigate's (matching
layer counts: 149 / 98 / 68 / 64). Build one event sub-app parameterised by
event, not two.

### Totals

| Status | Screens |
| --- | --- |
| ✅ Matches comp | 1 |
| 🟡 Built to August comp, now stale | 2 |
| 🟠 Exists in the old layout | 19 |
| ⬜ Not built | 32 |
| **Total** | **54** |

The 🟠 group is the good news: those screens already have data wiring, queries
and routes. They need re-skinning, not building.

---

## 3. Placeholder data that disagrees with itself

The comps use filler that contradicts across screens. None of it should be
built as fact:

| Field | Values in the design |
| --- | --- |
| Navigate dates | **15–17 March 2027** (Home, Agenda — consistent) |
| Navigate venue | *Moscone Center, SF* (Home) · *Sofitel Wentworth Sydney* (Hotel, Map) · *"at Crown"* (badge copy) |
| Speakers | Kylie Walsh (real) alongside filler names (*Aris Thorne*, *Dr. Sarah Kim*) |
| Support lead | *Jack Garcia* (filler) |

The March dates are consistent enough to adopt as fixtures. The venue needs
confirming — the repo seeds *Crown Towers, Perth*, which matches the badge copy.

---

## 4. Still not designed

From spec v3, with no frame anywhere:

- Polls & surveys (Feedback) — *Rate App* is app feedback, not session polling
- Gamification
- Analytics dashboard (admin side)
- Past-event video library (the Featured carousel may absorb this)
- CPD records (*Templates & Resources* may absorb this)
- Stripe checkout — website-side by design, correctly absent

---

## 5. What this means for delivery

**16 November is a pre-event launch.** With Navigate on 15–17 March 2027, the
November go-live is about accounts, registration, tickets and event
information. The on-site features — venue map in use, live support chat,
session recording, door scanning — are needed in March, not November.

That splits the work cleanly:

- **Phase 1 — launch-ready, 16 Nov 2026:** accounts, registration state,
  tickets and QR, the six tabs, the event sub-app as information, Connect and
  Profile content.
- **Phase 2 — event-ready, before 15 Mar 2027:** recording and transcription,
  the native app through App Store review, live chat, on-site check-in, live
  alerts.

The native wrapper moves off the November critical path entirely, which was the
open risk from the hybrid decision.

Sprint plan: [`EPIC-DESIGN-V2.md`](EPIC-DESIGN-V2.md).
