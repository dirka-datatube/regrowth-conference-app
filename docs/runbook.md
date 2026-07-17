# REGROWTH® Conference — Event-Day Runbook

Written for the REGROWTH team running the event, with an engineer on call.
Everything here works from the **admin panel** (`admin/` app) unless noted.

## Morning checks (10 minutes, before doors)

1. **Dashboard → Pipeline health**: every row should say `ok`. A failed
   `ac_sync` row usually means ActiveCampaign credentials/limits — content
   still works, new signups just won't flow until it recovers.
2. **Send a test push**: Push composer → category "Admin announcement" →
   target *Individuals* → pick a staff member → send. It should arrive
   within ~60 seconds.
3. **Check-in desk**: open Check-in desk, scan a staff member's QR (from
   their app profile). Count should tick up.

## How to…

| Need | Where | Notes |
| --- | --- | --- |
| Announce a room change | Push composer → Admin announcement | Can't be muted; delivered within a minute. Update the session's room in Agenda too — phones update in <30 s. |
| Add / edit a session | Agenda | Unpublish instead of delete if attendees may have picked it. Overlap warnings show inline. |
| Load a new attendee at the door | Attendees → New attendee | They can then sign in with that email immediately. |
| Moderate questions | Q&A moderation | Pending → Approve makes it visible + upvotable live. |
| Close an auction item | Auction → Close & assign winner | Winner gets the "You won" push automatically. Payment settles outside the app. |
| See partner leads | Reports → Export CSV | Also flows to ActiveCampaign automations when AC is configured. |
| Check in a late arrival without staff | Nothing to do | Their Home screen has "I'm here — check in". |

## Notification rules (what the system enforces)

- Max **4 non-announcement pushes per attendee per day**; excess is dropped
  lowest-priority-first (spotlight drops before session reminders).
- Attendees can mute every category except **Admin announcements**.
- Session reminders go out ~15 minutes before start to attendees who picked
  the session or follow one of its speakers — automatically, no action needed.

## When something breaks

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Pushes not arriving | Expo/APNs outage or missing `EXPO_ACCESS_TOKEN` | Check Dashboard pipeline health for `process_queue` failures. Fallback: ActiveCampaign email blast. |
| AI summaries not appearing | `ANTHROPIC_API_KEY` unset/exhausted | Notes are safe; summaries backfill when the key works again (sweep re-runs). |
| App shows stale agenda | Realtime hiccup | Attendees can pull-to-refresh; data corrects within 5 min regardless. |
| Nobody can log in | Supabase auth incident or SMTP limits | status.supabase.com; check Auth rate limits (custom SMTP raises them). |
| A specific person can't log in | Their email isn't in `attendees` | Add them via Attendees, have them retry. |

## Hard rules

- **Never enable demo mode** (`EXPO_PUBLIC_DEMO_MODE`) in any real build —
  it bypasses login with fake data. CI blocks it in build profiles.
- **Never hand out the service-role key.** The admin panel doesn't use it;
  nothing on event day needs it.
- Escalation order: on-call engineer (Dirk / DataTube) → Supabase support
  (Pro plan) → Expo status page.
