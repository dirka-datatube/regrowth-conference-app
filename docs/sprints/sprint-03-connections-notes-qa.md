# Sprint 3 — Connections, notes & Q&A

**Goal:** the three headline attendee interactions work end-to-end on device:
meet someone (QR / business card), capture thinking (notes + AI summary),
ask questions (moderated Q&A with realtime upvotes).

**Duration:** ~2 weeks · **Requires:** Sprints 1–2 done
**Spec DoD covered:** §10.3 (speakers/LinkedIn/follow), §10.4 (QR connect), §10.5 (notes + AI summary)

---

## Context for the agent

The screens and edge functions exist; this sprint replaces placeholders,
wires the camera paths, and closes the loops. Read first:
`components/QrModal.tsx` (placeholder!), `components/ScannerModal.tsx`,
`app/connections.tsx`, `app/connections/card.tsx`, `app/notes/new.tsx`,
`app/questions.tsx`, `supabase/functions/qr-connect/`,
`supabase/functions/business-card-ocr/`,
`supabase/functions/claude-summarise-notes/`.

## Prerequisites

- [ ] `react-native-qrcode-svg` installed (done in Sprint 1; verify)
- [ ] `ANTHROPIC_API_KEY` set in function secrets and working (test with a curl)
- [ ] AC automation for connection/lead events identified (names + triggers)

## Tasks

### 1. QR connect, end-to-end

- Replace the `QrModal` placeholder with a real QR render of `qr_token`
  (white on Cloud card for scan contrast).
- Scanner: debounce re-scans, torch toggle, and clear failure states
  (wrong-event QR, own QR, malformed payload). Prefix the QR payload
  (`regrowth:<token>`) so random QRs are rejected client-side.
- `qr-connect` function: verify auth — currently it trusts `scanner_id`
  from the request body. **Fix:** derive the scanner from the caller's JWT
  (pass through `Authorization` header → `supabase.auth.getUser()`), not
  from the body. This is a security bug; do not skip.
- Success UX: connected-with card showing the other person, link to their
  profile.

**Acceptance:** two devices, two accounts: A scans B → both see the
connection in Connection Hub; repeat scan is a friendly no-op; a stranger's
random QR is rejected. §10.4 ✅

### 2. Business card OCR loop

- Same JWT-derivation fix in `business-card-ocr` (`initiator_id` from token).
- Upload the card photo to the private `business-cards` bucket; store the
  path on `pending_connections.card_image_url`.
- Pending-connection UX: list pending cards in Connection Hub, allow edit of
  extracted fields, "save to contacts" (export vCard / mailto) since the
  card owner may not be an attendee.
- If extracted email matches an attendee → offer instant real connection.

**Acceptance:** photograph a card → fields extracted → appears in Connection
Hub pending list → email-match path creates a real connection.

### 3. Notes + AI summaries hardened

- Autosave in `app/notes/new.tsx` is fire-and-forget — add error surfacing
  (retry with backoff, "saved ✓ / retrying…" indicator) and await the final
  save on navigation away.
- Summaries: schedule `claude-summarise-notes` ~30 min after each session's
  `end_at` for attendees with non-empty notes (pg_cron sweep), in addition to
  the manual "Generate summary" button.
- Export: "email me my notes" → triggers an AC automation via `ac-event-emit`
  with the note content; "copy to clipboard" local.
- Voice check: summary prompt already enforces REGROWTH voice — verify output
  against brand rules with 3 sample notes.

**Acceptance:** take notes during a (test) session → summary + 3 follow-up
questions appear after end; export paths work. §10.5 ✅

### 4. Q&A moderation loop

- Admin panel (coordinate with the admin repo): moderation queue —
  approve / reject / edit / mark-answered, per session or speaker.
- App already renders approved questions with realtime; verify the
  `question_upvotes` unique constraint gives clean toggle behaviour (currently
  insert-only — add un-upvote or idempotent handling).
- Anonymous questions must never leak the author to other attendees —
  verify the select the app makes doesn't join attendee name when
  `anonymous = true` (it does join today; mask in the query or a view).

**Acceptance:** submit → invisible until approved → visible + upvotable on
another device in realtime; anonymous stays anonymous; moderator can mark
answered.

### 5. Speaker follow → personalisation hook

- "Follow" already writes `speaker_followers`; surface followed speakers'
  sessions in Home "up next" prioritisation and store the hook needed by
  Sprint 4's "session starting" pushes (query: followed speakers' sessions ∪
  schedule picks).

**Acceptance:** §10.3 verified on device (browse → LinkedIn opens in-app →
follow → followed speaker's session flagged on Home).

### 6. Partner interest → AC automation (first real emission)

- Tap "I'm interested" → `partner_interest` row + `ac-event-emit` fires →
  verify the event arrives in AC (test automation that tags the contact).
- Set `ac_event_emitted_at`; retry path if AC was down.

**Acceptance:** spec §10.8 demonstrably works (screenshot of AC automation run).

## Out of scope

Push notifications (Sprint 4), gallery upload flows, dining seating,
podcast RSS mirror (simple; slot into Sprint 5 polish).

## Definition of Done

- [ ] §10.3, §10.4, §10.5, §10.8 all pass on physical devices (two-device test)
- [ ] JWT-derivation security fix landed in `qr-connect` **and** `business-card-ocr`
- [ ] Anonymous Q&A leak closed; upvote toggle idempotent
- [ ] Notes autosave resilient; scheduled summaries running
- [ ] `docs/ROADMAP.md` updated (remove fixed defects, add any found)
