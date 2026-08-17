# Event App Spec v3 — Gap Analysis

**Analysis date:** 2026-08-17
**Source:** *Event App Spec to Datatube — In conjunction with SOW 1 & 2, Prepare Version 3 of SOW*
(meeting summary, 4 August 2026)
**Assessed against:** this repo at `03fe102`, plus [`docs/ROADMAP.md`](ROADMAP.md)
**Purpose:** establish what SOW v3 is actually asking for, what already exists, and
how far the request has moved from the plan the current build was scoped to.

---

## 1. What the spec asks for

Six areas, summarised.

### Non-negotiables

- **ActiveCampaign integration** — push data *back* into AC, and avoid duplicating
  contacts that already exist there.
- **Required data capture:** first name, surname, role, office, email, mobile,
  office address, catering preferences.
- **Tags (minimum 3, open to more):** Metro | Regional · previous attendee vs.
  first timer · EDM opt-in (retreats, courses, general updates).

### Naming and positioning

- Conference is **Navigate** — the REGROWTH Annual Conference for real estate
  leaders and high performers.
- Study tour is the **REGROWTH Study Tour** — a bespoke world-class client
  experience.
- The executive intro must be corrected: it currently says "APM conference" and
  describes the app as *expensive, clunky and slow*.

### Payments and access

- Registration and payment stay **on the website via Stripe**, not in-app, to
  avoid Apple's cut.
- Automated workflow: website → app download link sent post-payment.
- **Strong preference for a mobile website over a native app.** The App Store
  download is seen as a barrier to entry, based on experience with "Recruit RE".
  SOW must cost both separately — Table 1 = app, Table 2 = mobile website.
- No annual App Store registration or renewal if it can be avoided.

### Core functionality requested

Discount codes and early-bird cut-offs · Squarespace integration · optional public
profile sharing between attendees · QR check-in with duplicate-entry prevention ·
agenda/programme menu · video upload from past events · interactive venue maps ·
polling · gamification · sponsor booth check-in · analytics dashboard · AI
note-taking (**confirmed for 2 events only**) · refer-a-friend / loyalty discount
(feasibility TBC) · camera/video toggle plus a microphone record button, replacing
the "+" button.

### Navigation and IA

Bottom nav, **max 5 items** — but seven are listed:

| Item | Submenu |
| --- | --- |
| Home | — |
| Alerts | — |
| Events | Navigate or Study Tour → Programme/Agenda → Hotel & Accommodation → Interactive Maps → What to pack/bring → Weather |
| Insights | *(contents undefined)* |
| Connect | Connect with other attendees · Find a referral · Impact & Influence · Partners |
| Feedback | Polls & Surveys |
| Me | Personal profile · saved sessions · CPD records · event resources · app settings |

Plus, if possible: Services Booklet and Partners Booklet.

### Commercial and timeline

- SOW 03/1 referenced but never received — clarify whether it exists.
- $11,000 invoice overdue, to be paid once the SOW is locked.
- First two weeks of post-launch tweaks free of charge; 30-day no-charge bug-fix
  window from go-live.
- Page 11 pricing doesn't reconcile with the original SOW.
- Ongoing/maintenance costs need clarity.
- **13 working days** (Fridays): 21 Aug, 28 Aug, 4 Sep, 11 Sep, 18 Sep, 25 Sep,
  2 Oct, 9 Oct, 16 Oct, 23 Oct, 30 Oct, 6 Nov, 13 Nov.
- SOW executed **no later than 21 October**. Go-live **locked in for 16 November**.

---

## 2. Coverage against the current build

38 capabilities drawn from the spec. Status is against code in this repo, not
against intent.

**Built: 4 · Partial: 9 · Missing: 25**

### ActiveCampaign and attendee data

| # | Requirement | Status | Evidence / gap |
| --- | --- | --- | --- |
| 1 | AC → app contact sync | **Built** | `supabase/functions/ac-sync-attendees` pulls a configured list and upserts attendees |
| 2 | App → AC contact write-back | **Missing** | `ac-event-emit` posts *activity events* to `eventTrackEvents`. No contact record is ever created or updated in AC |
| 3 | De-duplicate contacts in AC | **Missing** | No email lookup before write. Nothing to dedupe against, because nothing is written |
| 4 | De-duplicate attendees locally | **Partial — defective** | See §3. The two write paths use different conflict keys and collide |
| 5 | First name / surname as separate fields | **Missing** | `attendees.name` is a single `text` column; AC sync concatenates `firstName + lastName` into it |
| 6 | Role | **Built** | `attendees.role` |
| 7 | Office and office address | **Partial** | `attendees.company` exists. No address column, and "office" (branch) may not equal company |
| 8 | Mobile | **Missing** | No phone column anywhere in the schema |
| 9 | Catering preferences | **Partial** | `attendees.dietary` is free text — needs renaming and structuring for catering headcounts |
| 10 | Three tag families | **Missing** | `attendees.interests text[]` is unstructured and unmapped. No metro/regional, no attendee history, no EDM opt-in |

### Naming and product structure

| # | Requirement | Status | Evidence / gap |
| --- | --- | --- | --- |
| 11 | "Navigate" branding | **Missing** | App is "REGROWTH Conference" throughout — `app.json` name, slug, bundle id `au.com.regrowth.conference`, all copy |
| 12 | REGROWTH Study Tour as a second product | **Missing** | Schema carries `event_id` on every table so it tolerates multiple events, but the app surfaces only one and there is no product switch |

### Payments, access and delivery

| # | Requirement | Status | Evidence / gap |
| --- | --- | --- | --- |
| 13 | Stripe registration and payment on the website | **Missing** | Zero Stripe code in the repo. No webhook receiver, no payment state on the attendee |
| 14 | Post-payment app download link automation | **Missing** | No trigger exists between payment and invite |
| 15 | Discount codes and early-bird cut-offs | **Missing** | No pricing, coupon or cut-off concept |
| 16 | Refer-a-friend / loyalty discount | **Missing** | Feasibility TBC — see §5 |
| 17 | Squarespace integration | **Missing** | `website-signup` is a generic webhook. Note the roadmap listed website platform as unconfirmed — the spec answers it: **Squarespace** |
| 18 | Mobile website delivery | **Partial** | `react-native-web` is a dependency and `npm run web` works, but this is a preview path, not a production mobile site. See §4 |

### Core functionality

| # | Requirement | Status | Evidence / gap |
| --- | --- | --- | --- |
| 19 | QR check-in with duplicate prevention | **Partial** | `check-in` guards with `.is('checked_in_at', null)` so the first timestamp is preserved — but returns `{ok:true}` either way, so a door scanner cannot tell a duplicate from a valid scan |
| 20 | Sponsor booth check-in | **Missing** | Check-in is attendee-to-venue only. No booth entity, no per-booth scan record |
| 21 | Agenda / programme | **Built** | `app/(tabs)/agenda.tsx`, `app/session/[id].tsx`, `sessions` + `session_speakers` tables |
| 22 | Hotel and accommodation | **Missing** | — |
| 23 | Interactive venue maps | **Missing** | Event has `venue_lat`/`venue_lng`/`geofence_radius_m` only |
| 24 | What to pack/bring, weather | **Missing** | — |
| 25 | Past-event video library and upload | **Missing** | Storage buckets exist for images; no video handling |
| 26 | Polls and surveys | **Missing** | `questions` supports moderated Q&A, which is a different mechanic |
| 27 | Gamification | **Missing** | — |
| 28 | Analytics dashboard | **Missing** | PostHog is a dependency; there is no dashboard, and the admin panel it would live in does not exist |
| 29 | AI note-taking | **Built** | `claude-summarise-notes` + `notes/`. Now needs gating to 2 events only |
| 30 | Camera/video toggle + mic record button | **Missing** | Camera is wired for QR scan and business-card OCR only. No audio capture, no `expo-av` |
| 31 | Optional public profile sharing | **Partial** | `attendee_visibility` enum (`public`/`connections_only`/`hidden`) exists in the schema; not surfaced as an opt-in the attendee controls |

### Navigation and IA

| # | Requirement | Status | Evidence / gap |
| --- | --- | --- | --- |
| 32 | Five-item bottom nav | **Partial** | Four tabs exist (Home, Alerts, Agenda, Event Notes) — but only Home and Alerts survive into the new IA |
| 33 | Events tab and submenu | **Missing** | Agenda exists as a tab; hotel, maps, packing, weather and the Navigate/Study Tour switch do not |
| 34 | Insights tab | **Missing** | Contents undefined in the spec |
| 35 | Connect tab | **Partial** | Attendees, partners, QR connect and the Impact & Influence podcast all exist — as separate drawer items, not a tab with a submenu. "Find a referral" does not exist |
| 36 | Feedback tab | **Missing** | Depends on polls and surveys (#26) |
| 37 | Me tab | **Partial** | `profile.tsx` covers profile and notification prefs. `schedule_picks` backs saved sessions but has no UI. No CPD records, no event resources |
| 38 | Services and Partners booklets | **Missing** | A partner *directory* exists; a booklet is a different artefact |

---

## 3. Defect found during this analysis

**The attendee de-duplication the client calls non-negotiable is currently broken.**

`attendees` carries two competing unique constraints:

```sql
ac_contact_id text unique,
unique (event_id, email)
```

The two write paths disagree about which one identifies a person:

- `website-signup` upserts on `(event_id, email)` and leaves `ac_contact_id` null.
- `ac-sync-attendees` upserts on `ac_contact_id`.

So when someone registers on the website and *then* appears in the AC list sync,
the sync builds a row with a new `ac_contact_id`, finds no conflict on that key,
attempts an insert, and hits the `unique (event_id, email)` constraint instead.
That raises `unique_violation`, which the `ON CONFLICT` clause does not absorb —
the whole 100-row batch throws and the function 500s.

The practical effect: the AC sync fails for every batch containing an attendee who
registered via the website first, which is the normal path. This has not been seen
yet only because `ACTIVECAMPAIGN_*` secrets are unset and the sync has never run
against real data.

Fix is small — resolve on email as the identity key and treat `ac_contact_id` as an
attribute, not a key — but it must be done before any AC work is priced as
"integration complete".

---

## 4. The platform question is the biggest decision in the SOW

The client has moved from a native app to a **strong preference for a mobile
website**, and wants both costed separately.

**What transfers.** The app is Expo + `react-native-web`, so most of the 3,896
lines across 33 screens — layout, navigation, data layer, Supabase client, brand
system — run in a browser today. Demo mode already proves it. This is not a
rewrite.

**What does not transfer cleanly.**

| Capability | Native | Mobile website |
| --- | --- | --- |
| Push notifications | Full (Expo Push, already built) | iOS Safari requires add-to-home-screen before web push works at all |
| Session reminders | Works | Depends on the above |
| Background audio recording | Records with the phone locked | Stops when the browser is backgrounded or the screen locks |
| Geofence check-in | Works | Not available — no background geolocation on the web |
| Offline write queue | Works | Background Sync API unsupported in Safari; cached *content* is fine |
| QR scanning | Reliable (`expo-camera`) | Solved by encoding a URL — see below |
| Business-card capture | `expo-camera` | `<input capture>` still-photo — arguably more reliable than native streaming |
| App Store fee | Annual renewal | None |
| Install friction | The stated objection | None |

**QR check-in is not a reason to go native.** The QR currently encodes a raw
`qr_token`. Encode a URL instead — `https://app.regrowth.au/c/<token>` — and the
phone's built-in camera app scans it, with no browser camera permission involved
at all. That covers attendee-to-attendee connect and sponsor booth check-in
outright. Door check-in runs on two to four staff devices under our control, so it
can use whatever works, with manual name search as the fallback that is needed
regardless. In-browser scanning is available if wanted (`getUserMedia` plus
`BarcodeDetector`, falling back to a WASM decoder outside Chrome), but it is a UX
nicety rather than a functional requirement.

**The two real casualties are push notifications and background audio recording.**

Session reminders are the single most-used feature of a conference app, they are
already built, and they are in the current Definition of Done. iOS web push only
works once the user adds the site to their home screen — which reintroduces an
install step, just a less familiar one than the App Store.

Background recording is the sharper problem, and it lands on a *confirmed*
deliverable. `MediaRecorder` stops when the browser is backgrounded or the screen
locks on iOS, so AI note-taking in a PWA requires the attendee to hold the phone
awake, app in front, for the whole session. That is not usable for a 45-minute
keynote. A native app records with the phone in a pocket.

There is a third option worth pricing: **mobile website as the primary surface,
plus a thin native wrapper** for attendees who want reminders and session
recording. It costs more than either single option but keeps both properties, and
the background-recording constraint argues for it more strongly than the camera
question ever did.

Note also that if delivery is web-only, the Stripe-on-website rationale ("avoids
Apple's cut") no longer applies — payment could sit anywhere. Keeping it on the
website is still right for Squarespace traffic, but the reason changes.

---

## 5. Answers to the five outstanding SOW items

The spec lists five things for Dirk to resolve. Three are technical:

**1. Stripe ↔ ActiveCampaign integration — feasible, well-trodden.**
Stripe webhook (`checkout.session.completed`) → edge function → AC contact
search-by-email → create or update → tag → trigger the download-link automation.
Discount codes and early-bird cut-offs are Stripe Coupons and Promotion Codes with
a `redeem_by` date; no custom pricing engine needed. The de-dup requirement is
satisfied by searching AC by email before writing, which is the same fix §3 needs.

**2. Refer-a-friend / loyalty — feasible, moderate build.**
Per-attendee Stripe promotion codes, with attribution stored as an AC custom field
and mirrored locally. The mechanic is straightforward; the cost is in the rules
(who qualifies, stacking with early-bird, when the discount is honoured) rather
than the code.

**3. Camera/video toggle + mic record — feasible natively, platform-dependent on web.**
`expo-camera` is already installed; audio needs `expo-av`. On mobile web this
becomes `MediaRecorder`, which is reliable on Android Chrome and inconsistent on
iOS Safari. Answer depends on §4.

The remaining two (SOW 03/1, invoice, page 11 pricing, tweak and bug-fix terms) are
commercial and sit outside this repo.

---

## 6. Deviation from the current plan

### Scope moved up; time moved down

The existing roadmap is five sprints at roughly ten working days each — about
**50 working days** — and that was scoped to finish the *previous* spec. Sprint 1
is not complete. The new spec adds **25 capabilities that do not exist**, and
allows **13 working days**.

### The timeline does not survive contact with the dates

- Last nominated working day is **Friday 13 November**. Go-live is **Monday 16
  November**. That is zero buffer — no UAT window, no contingency, no content
  freeze.
- If SOW execution uses its full runway to **21 October**, only four Fridays remain
  (23 Oct, 30 Oct, 6 Nov, 13 Nov).
- If delivery is native, App Store review must fit between 13 and 16 November, and
  the Apple Developer account is still an unresolved external dependency in the
  roadmap. That combination cannot hit the date. **On schedule grounds alone, the
  mobile website is the safer option.**

### The foundation is not finished

From `docs/ROADMAP.md`, still open and blocking anything built on top:

- Magic-link login fixed but **never verified on a device**
- **No scheduled jobs** — AC sync, daily suggestions and session reminders all
  need pg_cron; none is wired
- **Admin panel does not exist** — the analytics dashboard (#28) and all content
  loading depend on it
- QR rendering is a placeholder stub
- Auction bid logic is race-prone
- Edge functions trust caller-supplied attendee IDs
- No tests, no CI, no EAS config
- All function secrets unset: `ANTHROPIC_API_KEY`, `ACTIVECAMPAIGN_*`,
  `WEBSITE_WEBHOOK_SECRET`, `EXPO_ACCESS_TOKEN`

### Two structural rebuilds, not additions

- **IA.** Four tabs plus a twelve-item drawer becomes five tabs with nested
  submenus across two products. Only Home and Alerts survive. Every screen's
  navigation context changes.
- **Data model.** Splitting `name`, adding mobile and office address, adding three
  tag families, and supporting two products all touch `attendees` — which every
  other table references — plus the AC sync contract and the website webhook
  payload.

### Built, but no longer in the spec

Ten features exist in the repo and are absent from v3. They should be explicitly
kept or dropped rather than quietly abandoned, and not re-charged if kept:

charity auction (`auction.tsx`, `auction_items`, `bids`) · photo gallery ·
FAQs · dining experience · CommBank section · "Solutions to Support Your Business" ·
speaker directory with follow · business-card OCR · moderated Q&A · daily AI
suggestions.

### Honest characterisation

This is not a revision of the existing spec. It is **a different product brief that
overlaps the old one by roughly a third** — same backend, same brand, same event,
materially different surface area, an added second product, an added commerce
layer, and a possible change of delivery platform. Pricing it as a delta on SOW 1 &
2 would understate it.

---

## 7. What is needed before SOW v3 can be priced

### Decisions from REGROWTH

1. **App, mobile website, or both** — and written acceptance of the push
   notification trade-off in §4.
2. **Which five of the seven nav items** get bottom-tab slots. The spec lists seven
   against a stated cap of five.
3. **What "Insights" contains.** Undefined in the spec.
4. **Keep or drop** the ten built-but-unlisted features above.
5. **Which two events** get AI note-taking.
6. **Analytics dashboard** — admin-facing, attendee-facing, or both.
7. **Squarespace integration shape** — embed, subdomain, or link-out.
8. **Scope or date must move.** 25 missing capabilities in 13 days with zero buffer
   is not deliverable. Options: cut to a Navigate-only v1 and defer Study Tour;
   move go-live; or increase the day count.

### Commercial items to resolve in writing

SOW 03/1 existence · $11,000 invoice · page 11 pricing reconciliation · two-week
free tweak window · 30-day bug-fix window · ongoing maintenance costs.

### External dependencies still outstanding

ActiveCampaign API credentials, list IDs and automation inventory · Stripe account
and product/price setup · Squarespace admin access · Apple Developer account (if
native) · font licences for Butler, Northwell Alt and DIN · Supabase org and
billing owner.

---

## 8. Recommended shape for v1

If the 16 November date is genuinely fixed, the deliverable that fits 13 days:

**In:** Navigate only · mobile website · corrected naming and positioning · the
full data capture set and three tag families · fixed two-way AC sync with
de-duplication · Stripe registration with discount codes and early-bird ·
post-payment download/access link · five-tab IA · agenda · QR check-in with real
duplicate feedback · polls and surveys · profile and saved sessions.

**Deferred to a phase 2:** Study Tour as a second product · interactive venue maps ·
past-event video · gamification · sponsor booth check-in · analytics dashboard ·
CPD records · refer-a-friend · booklets · camera/video and mic capture.

That is still aggressive for 13 days, and it assumes the foundation items in §6 are
treated as part of the build rather than as prerequisites someone else finishes.
