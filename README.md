# REGROWTH® Annual Conference App

The mobile companion for the REGROWTH Annual Conference, built in Expo
(React Native) on top of Supabase. The admin panel that pairs with this app
is a separate Lovable / Next.js project — both share this Supabase project.

> Build prompt and requirements: see the project brief shared with the team.
> Brand guidelines: REGROWTH brand PDF (palette, fonts, voice).
>
> **Production roadmap:** [`docs/ROADMAP.md`](docs/ROADMAP.md) — current state,
> known defects, and five ordered sprint briefs in [`docs/sprints/`](docs/sprints/)
> written so a human or an AI agent can execute them one by one.

---

## Quick preview (no Supabase, no fonts, no setup)

Three commands and you'll be clicking around the app in your browser with
canned data. No accounts, no env vars, no database.

```bash
git checkout claude/regrowth-conference-app-4EqIq
npm install
npm run demo
```

This opens Metro on `http://localhost:8081` — press `w` (or it'll auto-open
the web version). The app loads as the demo attendee "Kylie Walsh" with
sample sessions, speakers, partners, suggestions, auction items and Q&A.
Writes (bidding, taking notes, submitting questions) won't persist —
demo mode is read-only by design.

> On Windows: `set EXPO_PUBLIC_DEMO_MODE=true && npm run web`
> Camera-based features (QR scan, business card OCR) won't work in a browser.

---

## Stack

| Concern | Choice |
| --- | --- |
| App framework | Expo SDK 51 (React Native), Expo Router (file-based) |
| Styling | NativeWind (Tailwind) — brand palette in `tailwind.config.js` |
| State | Zustand (`lib/store.ts`) for global, React Query for server |
| Backend | Supabase (Postgres + Auth + Realtime + Storage + Edge Functions) |
| Auth | Magic links via `@supabase/supabase-js` + Expo AuthSession |
| Push | Expo Push (`lib/push.ts` + `supabase/functions/send-push`) |
| AI | Claude (Anthropic) via Supabase edge functions |
| Analytics / errors | PostHog + Sentry |

---

## Repo layout

```
app/                 — Expo Router screens (file-based routing)
  (auth)/            — Welcome / login / check-email
  (tabs)/            — Home, Alerts, Agenda, Event Notes
  speakers/          — list + detail
  partners/          — list + detail
  attendees/         — directory + detail
  session/[id].tsx   — agenda item detail
  notes/             — note editor + summary view
  connections.tsx    — QR connect + business card OCR
  auction.tsx        — live charity auction
  dining.tsx faqs.tsx podcast.tsx commbank.tsx solutions.tsx gallery.tsx
  questions.tsx      — Submit Your Questions + live Q&A
  profile.tsx        — edit profile + notification prefs
  menu.tsx           — top-level drawer menu
  auth-callback.tsx  — magic-link redirect target

components/          — Brand UI primitives (Type, Card, Button, Screen, …)
lib/                 — supabase client, auth, theme, push, query client, hooks
types/               — DB types (matches the SQL migration)
supabase/
  config.toml        — local supabase
  migrations/        — schema + RLS + storage buckets
  functions/         — edge functions (Claude, ActiveCampaign, push, QR, OCR, check-in)
  seed.sql           — local dev seed data
assets/fonts/        — REGROWTH brand fonts (license required — see folder README)
```

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Env vars

Copy `.env.example` to `.env` — it already contains the live public values
for the production Supabase project ("ReGrowth App" / `blcfeguqhnggyxvexggy`).
Secrets only live in Supabase edge function env, never in the app bundle.

### 3. Supabase

**The production project is already provisioned** (migrations, seed data,
all 9 edge functions — see `docs/ROADMAP.md` → "Live backend facts").
For local development instead:

```bash
supabase start
supabase db reset           # applies migrations + seed
supabase functions serve
```

### 4. Brand fonts

Licensing is deferred (2026-07-17): the app ships with iOS built-in
fallbacks mapped in `tailwind.config.js`. Restore steps live in
`lib/fonts.ts` for when Butler / Northwell Alt / DIN are licensed.

### 5. Run the app

```bash
npm run ios
```

---

## Architecture notes

### Single source of truth — ActiveCampaign

Attendee email + name + company come from ActiveCampaign. The
`ac-sync-attendees` edge function pulls from a configured AC list every 15
minutes; `website-signup` is a webhook the website hits when someone
registers. **We never ask for data we already have.** Dietary requirements,
interests, etc. come through pre-populated.

### One event at a time

V1 supports a single event. The schema tolerates multiple (`event_id` is
on every table) but the app surfaces only the attendee's current one.

### RLS is on for every table

Any new table must `enable row level security` and add a policy. The app uses
the anon key + the user's JWT; admins authenticate separately via the
admin panel.

### Notification cap

`send-push` enforces no-more-than-4-non-admin notifications per attendee per
day, plus per-category opt-outs. Admin announcements bypass both.

### Personalisation

Daily `claude-suggestions` returns 3 attendees + 2 partners cached in
`daily_suggestions`. Home reads it; if missing, it triggers a fresh run.
The Claude API is invoked via edge functions only — no API keys in the app
bundle.

### Realtime

Q&A, auction bids, and notifications are subscribed in-app via Supabase
Realtime channels. Sessions are also published in case the admin moves
something during the day.

### Offline

React Query persists to AsyncStorage (`lib/queryClient.ts`). Speakers,
sessions, partners, FAQs are cached aggressively (5-minute stale time, 24h
gc). Mutations require connectivity (intentional — bids and Q&A must hit
the server).

---

## Definition of done (from spec §10)

- [ ] Magic-link sign in
- [ ] Personalised home (suggested person, partner, next session)
- [ ] Speaker browse + LinkedIn + follow
- [ ] QR-scan connect
- [ ] Take notes + receive AI summary
- [ ] Push notification 15 mins before a session on your schedule
- [ ] New agenda item from admin appears < 30s
- [ ] AC automation fires on partner "I'm interested"

---

## Things to clarify (from spec §11)

Track these in the project tracker — they block content load, not engineering:

- Final agenda + session count
- ActiveCampaign list IDs and existing automations
- Website platform + form/webhook owner
- Photo + headshot consent wording
- Notification copy ownership (Kylie writes vs. templated)
- Q&A routing — moderated panel-by-panel or open?
- CommBank section content + brand sign-off
- Auction logistics — payment, winner notification, delivery
- Last year's app data — specific failures to beat
- Apple Developer account ownership

---

## Admin panel

Lives in [`admin/`](admin/) — a Next.js 14 app against the same Supabase
project. It authenticates admins via magic link (`admin_users` gate) and does
**all writes through RLS as the signed-in admin** — no service-role key in
the browser, every mutation audit-logged.

```bash
cd admin
cp .env.example .env.local
npm install && npm run dev   # http://localhost:3000
```

Deploy to Vercel with the three `NEXT_PUBLIC_*` env vars, then add the
deployed URL to Supabase Auth redirect URLs.

Operations guide for event day: [`docs/runbook.md`](docs/runbook.md).
