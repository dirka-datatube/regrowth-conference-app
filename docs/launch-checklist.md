# Launch checklist — go/no-go

Work through top to bottom; everything in "Engineering: done" is verified and
needs no action. Target: all boxes ticked one week before day one.

## Engineering: done and verified (2026-07-17)

- [x] Schema, RLS (assertion suite passing live), storage, realtime
- [x] 10 edge functions deployed; identity JWT-derived; rate limits on AI endpoints
- [x] 8 cron pipelines live (sync, queue, reminders, don't-miss, summaries, suggestions, people-to-meet, podcast)
- [x] Race-safe bidding (`place_bid`), outbid + winner pushes
- [x] Brand UI (light-first), 4-tab navigation, onboarding, gallery uploads
- [x] OTP login fallback, geofence one-tap check-in, venue QR poster generator
- [x] CI: typecheck + lint + Deno unit tests + demo-mode guard; directory query 0.65 ms @ 500 attendees

## Credentials & config (Dirk, ~30 min once keys exist)

- [ ] `ANTHROPIC_API_KEY` → function secrets (AI summaries/suggestions/OCR)
- [ ] `ACTIVECAMPAIGN_API_URL` / `_API_KEY` / `_LIST_ID` → function secrets
- [ ] `WEBSITE_WEBHOOK_SECRET` → function secrets + website developer
- [ ] `EXPO_ACCESS_TOKEN` → function secrets
- [ ] `PODCAST_RSS_URL` → function secrets (Impact & Influence feed)
- [ ] Auth redirect URLs: `regrowth://auth-callback`, `regrowth://check-in`, dev URLs, admin Vercel URL
- [ ] **Custom SMTP** (Resend/Postmark) + branded template from
      `docs/integrations/email-templates/magic-link.html` (must keep `{{ .Token }}`)
- [ ] Sentry DSN (`EXPO_PUBLIC_SENTRY_DSN`) + PostHog key when wanted

## Apple / builds (Dirk + Kylie's org)

- [ ] Apple Developer account access; `appleTeamId` into `eas.json`
- [ ] APNs key into EAS credentials
- [ ] `eas build --profile preview` → magic-link login verified on hardware
- [ ] TestFlight internal → external pilot group (~15)
- [ ] App Store privacy labels + consent copy sign-off

## REGROWTH team (Kylie)

- [ ] Brand guidelines PDF into `docs/brand/` → Sprint 6 direction ratified
      (screenshot gallery: `npm run demo`, see `docs/brand/screens/README.md`)
- [ ] Real content loaded: agenda, speakers + headshots, partners, FAQs,
      auction items, dining sessions, CommBank copy
- [ ] Admin team added (`admin_users`) + runbook drill completed
- [ ] AC automations built for the four app events
- [ ] Notification copy ownership decided; §11 open questions answered

## Hardware verification (two devices, record it)

- [ ] The ten-point spec §10 pass (see sprint-10 brief, task 2)

## Final go/no-go (1 week out)

- [ ] Pipelines green 7 consecutive days (admin Dashboard)
- [ ] Push certificates valid beyond event dates
- [ ] Crash-free sessions ≥ 99.5 % in TestFlight
- [ ] On-call rota + venue wifi contingency agreed (offline shell + staff desk)
