# KPIndicator production completion plan

Objective: finish KPIndicator as a production-ready demand-validation service with one clear
promise: **know which idea customers want before you build it**.

## Guardrails

- Preserve the installed Next.js 15.5.24, React 19, Tailwind v4, Prisma 6, Stripe, SES, and
  PostHog stack.
- Keep external integrations honest and optional in local development; never simulate a paid
  order or delivered email as real.
- Require authentication and role/organization authorization for private reads and mutations.
- Label seeded and illustrative evidence clearly.
- Do not perform external sends, purchases, DNS changes, or deployment without configured
  credentials and an explicit operator action.

## Milestone 1 — Audit and baseline

Acceptance criteria:

- [x] Repository instructions and product documentation reviewed.
- [x] Routes, schema, integrations, and current security boundaries inventoried.
- [x] Baseline lint, type-check, and production build run.
- [x] Installed Next.js package checked for `dist/docs` (not present in this distribution).
- [x] Stale documentation and the baseline lint warning corrected.

Validation: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## Milestone 2 — Focused positioning and conversion

Acceptance criteria:

- [x] Homepage, navigation, pricing, process, about, and CTAs consistently lead with demand
  validation before building.
- [x] Growth/incorporation are removed from the primary funnel or clearly subordinate.
- [x] Idea-review form captures stage, target customer, prior tests, budget, and timeline without
  feeling like an enterprise form.
- [x] Submissions persist, appear in an authenticated admin inbox, have clear states, and include
  rate limiting plus honeypot protection.
- [x] Core funnel analytics events are emitted only when PostHog is configured.
- [x] Metadata, sitemap, robots, accessibility, empty/error/loading states, and responsive layout
  are coherent.

Validation: focused unit tests, browser checks at mobile and desktop sizes, build.

## Milestone 3 — Email acquisition system

Acceptance criteria:

- [x] Campaigns store editable plain-text bodies and support starter templates plus short follow-ups.
- [x] Recipient parsing is reusable, validated, case-insensitive, and tested.
- [x] Admin can create, preview, test, send/resume batches, search, and inspect campaigns.
- [x] SES sending is isolated behind an adapter, batch-limited, and remains visibly unavailable
  when configuration is missing.
- [x] Delivery events, failures, bounces, complaints, clicks, and unsubscribes are recorded without
  allowing status regressions.
- [x] Global suppression prevents future sends to unsubscribed, bounced, or complained addresses.
- [x] Unsubscribe links are signed and work without authentication.
- [x] Webhooks fail closed in production and provider payload/signature behavior is documented.
- [x] Opens are presented as weak signals; clicks and qualified outcomes receive priority.

Validation: parser, suppression, token, webhook, and send-service tests; authenticated browser
checks; lint/type/build.

## Milestone 4 — Security, payments, and operations

Acceptance criteria:

- [x] Every admin mutation verifies an admin session.
- [x] Dashboard queries and team mutations retain organization/project authorization.
- [x] Contact/auth endpoints have practical abuse protection and safe error messages.
- [x] Stripe checkout package mapping is tested; webhook verification and idempotency remain intact.
- [x] Success/cancel/unconfigured states are truthful and useful.
- [x] Admin can see contact submissions and orders needed for operations.

Validation: access-control and Stripe tests, route inspection, browser checks, build.

## Milestone 5 — Decision dashboard and credibility

Acceptance criteria:

- [x] Dashboard/report language clearly separates visits, leads, qualified actions, deposits,
  and weak signals where the data model supports them.
- [x] Existing seed data tells one coherent validation-to-presale story.
- [x] Illustrative case studies and sample metrics cannot be mistaken for real customer evidence.
- [x] Sample report, thresholds, caveats, timelines, and go/pivot/no-go definitions are easy to find.
- [x] Privacy and terms contain an honest operational baseline and an explicit counsel-review note,
  rather than demo placeholder copy.

Validation: seed run, data assertions, browser checks, content audit.

## Milestone 6 — Tests, documentation, and release validation

Acceptance criteria:

- [x] A minimal test runner covers recipient parsing, event progression, rate limiting,
  suppression, webhook progression, Stripe/package mapping, and metric calculations.
- [x] README and docs match PostgreSQL, authentication, SES, Stripe, PostHog, DNS, webhooks,
  deployment, and demo/production behavior.
- [x] Database migrations apply. Seed execution was intentionally skipped against `kpindicator_prod`.
- [x] All public/auth routes and signed-out dashboard/admin boundaries receive HTTP smoke checks.
- [x] Lint has no warnings, TypeScript passes, tests pass, and production build passes.
- [x] Remaining work is limited to documented external credentials, account verification, legal
  review, DNS, and deployment actions.

Validation:

```bash
npm run lint
npx tsc --noEmit
npm test
npx prisma migrate status
npm run db:seed
npm run build
```

## Progress log

- 2026-08-30: Audit started. Existing cookie auth, organizations, email verification, team access,
  Stripe webhook idempotency, and graceful integration fallbacks confirmed. Baseline type-check and
  production build pass; lint reports one unused variable. Next.js `dist/docs` is absent from the
  installed package, so implementation will follow installed types/source and existing conventions.
- 2026-08-30: Focused the public funnel, expanded qualified idea-review intake, added protected
  inquiry/order operations, implemented SES campaign drafts/tests/batches, starter sequences,
  CSV import, suppression and signed unsubscribe, hardened webhooks and checkout confirmation,
  clarified dashboard signals, added ten tests, applied both migrations, and completed release
  checks. No email or payment was initiated. Seed was not run because the configured database is
  explicitly named `kpindicator_prod` and the seed script is destructive.
