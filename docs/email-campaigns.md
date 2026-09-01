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
  Company`, one per line, duplicates merged automatically). Choose one of three concise starter
  sequences, edit the subject and plain-text message, and create a reviewable draft.
- **Preview and explicit send** — campaign detail shows the exact draft, supports a test message,
  and sends pending recipients through Amazon SES only after an admin confirms. Sends are capped
  at 50 recipients per batch.
- **Suppression and unsubscribe** — signed unsubscribe links write to a global suppression list.
  Bounces and complaints are also suppressed and cannot be silently re-imported later.

## Production setup still required

Sending uses Amazon SES. It stays disabled unless credentials, `SES_FROM_EMAIL`, and
`EMAIL_PHYSICAL_ADDRESS` are configured. Before production, verify the sender domain, publish SPF,
DKIM, and DMARC, request SES production access, set `EMAIL_UNSUBSCRIBE_SECRET`, and configure a
signed event adapter. The generic `/api/webhooks/email` endpoint fails closed in production when
`EMAIL_WEBHOOK_SECRET` is absent.

## Provider event adapter

Sending is implemented behind `src/lib/campaign-email.ts`; replacing SES means swapping that
adapter without changing campaign state or suppression rules. Receiving engagement events still
needs a thin, signed SES/SNS adapter. Map the provider event into
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

Status progression is monotonic — an out-of-order webhook cannot downgrade engagement, and a
terminal unsubscribe, bounce, or complaint cannot be reversed by a later open. See
`src/lib/email-events.ts`.
