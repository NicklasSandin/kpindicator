# Email campaign tracking

KPIndicator's own outbound marketing (emailing prospective clients), tracked at `/admin` — separate
from a client's idea being tested via email outreach as part of their project (that's
`Campaign` / `Channel.EMAIL` in the main schema; see [database-schema.md](./database-schema.md)).

This is an internal tool, not linked from the marketing site or the client dashboard, and
excluded from the sitemap and robots.txt. Reachable directly at `/admin`.

## What's built today

- **`/admin`** — portfolio view across all campaigns: total sent, open rate, click rate.
- **`/admin/campaigns`** — every campaign with its recipient count and rates.
- **`/admin/campaigns/[id]`** — the "see opened emails, how it's going" view: a funnel
  (sent → delivered → opened → clicked), summary stats, and a searchable, per-recipient table
  showing exactly who opened what, how many times, and when they last clicked — sorted with the
  most-engaged recipients first.
- **`/admin/campaigns/new`** — create a campaign and paste in a recipient list (`Name <email>,
  Company`, one per line, duplicates merged automatically). This does **not** send anything — it
  creates the campaign as a draft with recipients marked pending, giving you a place to track a
  send you make through whatever tool you're currently using.

## What's intentionally not built yet

**Actually sending email.** No ESP (Resend, Postmark, SendGrid, Mailgun, Loops, etc.) is wired
up — sending settings are still pending. Building against the wrong provider's API would mean
throwing that work away, so this repo ships the tracking/reporting layer now (useful regardless
of provider) and leaves sending as a clearly-scoped follow-up.

## Wiring up a real ESP, once one is chosen

Two things need to happen:

**1. Sending.** Whichever provider is picked, sending a campaign becomes: iterate
`EmailCampaign.recipients`, call the provider's send API per recipient (or their batch/broadcast
API), and set `EmailCampaign.status = "SENDING"` then `"SENT"`. Worth tagging each send with our
`recipientId` in the provider's metadata/custom-args field if it supports one — that makes
webhook matching in step 2 exact instead of best-effort.

**2. Receiving engagement events.** Point the provider's webhook at
[`/api/webhooks/email`](../src/app/api/webhooks/email/route.ts). That endpoint already accepts a
normalized event shape:

```json
{
  "type": "opened",
  "email": "prospect@example.com",
  "campaignId": "cm...",
  "recipientId": "cm...",
  "occurredAt": "2026-08-26T12:00:00Z",
  "url": "https://kpindicator.co/pricing"
}
```

Each provider's actual webhook payload looks different, so the integration work is a small
adapter that maps their shape to this one — for example:

| Provider | Their event field | Maps to our `type` |
|---|---|---|
| Resend | `type: "email.opened"` | `"opened"` |
| Postmark | `RecordType: "Open"` | `"opened"` |
| SendGrid | `event: "open"` | `"opened"` |
| Mailgun | `event: "opened"` | `"opened"` |

Either add a provider-specific route (e.g. `/api/webhooks/email/resend`) that translates and
forwards to the logic in `/api/webhooks/email`, or inline the provider's shape directly into that
route once it's the only one in use — whichever is less code once we know the provider.

Set `EMAIL_WEBHOOK_SECRET` in `.env` once wired up, and configure the provider to send it as a
shared secret (most support a custom header or signing secret) so `/api/webhooks/email` isn't
open to arbitrary requests in production.

## Data model

See [`prisma/schema.prisma`](../prisma/schema.prisma) — `EmailCampaign` → `EmailRecipient` (one
row per person per campaign, holds current-state rollups: status, open/click counts, last-opened
timestamp) → `EmailEvent` (append-only log of every individual event, for the audit trail and
for recomputing rollups if needed). Same append-only-events-rolled-up-to-current-state pattern as
`MetricSnapshot` elsewhere in the schema.

Status progression is monotonic — an out-of-order webhook (e.g. a delayed "delivered" event
arriving after "opened" was already recorded) won't downgrade a recipient's status. See the
`ENGAGEMENT_RANK` comment in `/api/webhooks/email/route.ts`.
