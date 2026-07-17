# Sprint 9 — Content, integrations & comms go-live

**Goal:** the system stops running on seed data and placeholder credentials.
Real agenda, real attendees flowing from ActiveCampaign, real emails, the
admin panel in Kylie's team's hands. After this sprint the product is
*operationally* live even though the event hasn't started.

**Duration:** ~2 weeks · **Requires:** Sprints 6–8
**Heavily human-gated — engineering pairs with REGROWTH throughout.**

---

## Tasks

### 1. ActiveCampaign end-to-end (the data spine)
- Secrets in: `ACTIVECAMPAIGN_API_URL`, `_API_KEY`, `_LIST_ID`.
- Verify the 15-min sync against the real list: idempotent, never clobbers
  `user_id` / `qr_token` / app-edited fields; document field mapping in
  `docs/integrations/activecampaign.md` (create it).
- Wire + test the four allow-listed events (`partner_interest`,
  `onboarding_complete`, `notes_export`, `connection_made`) into real AC
  automations with Kylie's team; screenshot each firing.
- Website webhook: share `WEBSITE_WEBHOOK_SECRET` with the website owner,
  test a real signup → attendee row → AC welcome automation.

### 2. Comms infrastructure
- **Custom SMTP** (Resend/Postmark) into Supabase Auth — removes the
  ~2 emails/hour magic-link ceiling. Branded email template (monogram,
  Earth button) matching the collateral.
- `EXPO_ACCESS_TOKEN` + `ANTHROPIC_API_KEY` into function secrets (if not
  already done); verify AI summaries + suggestions run on real data.
- Notification copy: template the recurring pushes (session reminder,
  people-to-meet, outbid, winner) with REGROWTH-voice copy signed off by
  Kylie; decide who writes ad-hoc announcements at the event.

### 3. Admin panel to production
- Deploy `admin/` to Vercel; env vars; URL into Supabase auth redirects.
- Add Kylie's team to `admin_users` with sensible roles (owner/editor/
  moderator split per the enum).
- **Training session** using `docs/runbook.md`: each team member performs a
  room change, a push, a moderation, an auction close in a staging drill.
- Storage upload UX: direct headshot/logo upload from the admin pages
  (bucket policies already allow it) — replaces the paste-a-URL workflow.

### 4. Real content load
- Full agenda, speakers (with rights-cleared headshots), partners +
  solutions content, FAQs, dining sessions, auction items, CommBank page
  copy (brand sign-off), venue lat/lng + geofence radius on the event row.
- Content review pass on-device: every detail page reads well, no orphan
  sessions/speakers, overlap warnings resolved.

### 5. Open questions from the original brief — close them
Photo/consent wording (App Store also needs it), auction winner logistics,
Q&A routing (panel-by-panel vs open), last year's failure notes → each gets
an owner + a decision recorded in the ROADMAP decisions log.

## Definition of Done
- [ ] AC sync + all four automations proven on the real account
- [ ] Custom SMTP live; branded auth email; rate-limit ceiling gone
- [ ] All function secrets set; AI features verified on real data
- [ ] Admin on Vercel; Kylie's team trained (drill completed) with roles
- [ ] Real content loaded + reviewed on-device; CommBank signed off
- [ ] Every §11 open question has a recorded decision
