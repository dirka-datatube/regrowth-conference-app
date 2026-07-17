# ActiveCampaign integration

AC is the **source of truth** for attendee email, name, and company. The app
never asks for data AC already has.

## Secrets (Supabase → Edge Functions → Secrets)

| Secret | Example | Notes |
| --- | --- | --- |
| `ACTIVECAMPAIGN_API_URL` | `https://regrowth.api-us1.com` | Settings → Developer in AC |
| `ACTIVECAMPAIGN_API_KEY` | `…` | same page |
| `ACTIVECAMPAIGN_LIST_ID` | `3` | the conference attendee list |

## Inbound: contacts → attendees

`ac-sync-attendees` runs every 15 min (pg_cron `ac-sync-attendees`).

Field mapping (AC → `attendees`):

| AC | attendees | Rule |
| --- | --- | --- |
| `id` | `ac_contact_id` | upsert conflict key |
| `email` | `email` | lowercased by citext |
| `firstName + lastName` | `name` | joined |
| `organization` | `company` | nullable |

Never touched by sync: `user_id`, `qr_token`, `notification_prefs`,
`interests`, `bio`, `photo_url`, `dietary`, `visibility` — app-owned.

Health: admin Dashboard → Pipeline health (`sync_runs`), or
`select * from sync_runs where job='ac_sync' order by started_at desc`.

Known limit (documented): a contact whose email already exists as an
app-created attendee without `ac_contact_id` will conflict on
`(event_id,email)` — resolve by back-filling `ac_contact_id` once creds are
live (one-off script, see Sprint 9 tasks).

## Outbound: app events → AC automations

`ac-event-emit` POSTs Event Tracking events. Allow-listed names:

| Event | Fired when | Suggested automation |
| --- | --- | --- |
| `partner_interest` | attendee taps "I'm interested" | notify partner + tag contact |
| `onboarding_complete` | onboarding finished | welcome/engagement track |
| `notes_export` | "email me my notes" | send notes email (data.body/summary) |
| `connection_made` | reserved | post-event intro emails |

Event Tracking must be enabled (AC → Settings → Tracking → Event Tracking)
and the automations built by the REGROWTH team.

## Website signups

`website-signup` edge function, header `x-webhook-secret` =
`WEBSITE_WEBHOOK_SECRET`. POST JSON:

```json
{
  "event_id": "00000000-0000-0000-0000-000000000001",
  "email": "a@b.com", "name": "Jane Agent",
  "company": "…", "role": "…", "interests": ["Leadership"], "dietary": "…"
}
```

URL: `https://blcfeguqhnggyxvexggy.supabase.co/functions/v1/website-signup`
