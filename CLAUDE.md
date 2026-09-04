# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm install
npm run dev            # dev server (Turbopack), http://localhost:3000
npm run build           # production build
npm run start            # serve the production build
npm run lint              # eslint (next/core-web-vitals + next/typescript)
npm run db:migrate        # prisma migrate dev — applies migrations, regenerates client
npm run db:seed            # tsx prisma/seed.ts — deterministic demo data, safe to re-run
npm run db:studio           # Prisma Studio, browse the DB in a UI
```

Tests: `npm test` runs the Node suite (`tsx --test tests/*.test.ts`, 36 tests). The PHP
checkout has its own dependency-free suite at `checkout/tests/run.php`, which only runs on
the server — PHP is not installed on the dev machine.

Single-purpose one-offs against the DB (e.g. checking a value, cleaning up test rows) are
normally done directly with `psql` / Prisma Studio rather than app code, since there's nothing
to run through the app's routes for pure data inspection.

## Architecture

Next.js 15 App Router + TypeScript, Prisma 6 (PostgreSQL in production — see below), Tailwind v4
+ shadcn/ui (Nova preset), MDX content, Stripe, PostHog, AWS SES. Full stack rationale and
environment variables are in [README.md](README.md) — read that first for the "what" and "why".
[docs/](docs/) has deeper narrative docs (schema ER diagram, user flows with mermaid diagrams,
email-campaign design, the validation-report template) — prefer those over re-deriving this from
the code when working in those areas.

### Three route groups, three audiences

- `src/app/(marketing)/` — public site (home, pricing, case studies, blog, contact). Shares
  `(marketing)/layout.tsx` (header/footer).
- `src/app/dashboard/` — client portal. Separate layout (sidebar, no marketing chrome). Every
  page reads the signed-in user through `getCurrentUser()` (`src/lib/current-user.ts`) — never
  read the session directly in a page.
- `src/app/admin/` — KPIndicator's *internal* tooling (their own outbound email marketing to
  prospective clients — not client-facing, not to be confused with `Channel.EMAIL` on a client's
  `Campaign`, which is a client's idea being tested via email outreach). Every page reads through
  `getCurrentAdmin()` (`src/lib/current-admin.ts`).

Both `current-user.ts` and `current-admin.ts` are thin wrappers around
`getSessionUser()` (`src/lib/auth.ts`) — that's the single choke point for session handling, by
design, so auth changes happen in one place.

### Auth

Real cookie-based session auth (`src/lib/auth.ts`): scrypt password hashing, session tokens are
random bytes, only the sha256 hash is persisted (`Session.tokenHash`) so a DB read alone can't
forge a session, `kp_session` cookie is httpOnly/secure/sameSite=lax with a 30-day TTL. Routes:
`src/app/api/auth/{signup,login,logout,audience}` and pages at `/signup`, `/login`, `/onboarding`.
`getCurrentUser()` redirects signed-out visitors to `/login` and signed-in-but-no-`audience`-set
users to `/onboarding` (the post-signup persona picker: STARTUP/INVESTOR/EXPLORER) — `ADMIN`
users skip the onboarding requirement. `getCurrentAdmin()` redirects non-admins to `/dashboard`
rather than erroring, since a client landing on `/admin` is a routing mistake, not something they
need to act on.

Note: [README.md](README.md)'s "Auth note" section is stale — it describes an earlier
placeholder-only state (no login, fixed seeded users). Real auth now exists; update that section
when touching auth-adjacent docs.

### Data model

Two independent domains in one schema (`prisma/schema.prisma`), don't conflate them:

1. **Client-facing**: `User → Project → Idea → Campaign → MetricSnapshot`, plus `Report`
   (per-idea and portfolio-level) and `Order` (Stripe payments). See
   [docs/database-schema.md](docs/database-schema.md) for the ER diagram and the reasoning
   behind the shape (e.g. `Order`↔`Project` is linked by `userId` + timing, not a hard FK,
   because project creation is a deliberate manual step after a sales call, not an automated
   continuation of checkout).
2. **KPIndicator's own outbound marketing**: `EmailCampaign → EmailRecipient → EmailEvent`,
   tracking opens/clicks/bounces for prospecting emails. Provider-agnostic on purpose — no ESP
   is wired up for sending yet, see [docs/email-campaigns.md](docs/email-campaigns.md) for what's
   built vs. deliberately not.

**Production database is PostgreSQL**, not SQLite — `prisma/schema.prisma`'s datasource
`provider` was switched from `sqlite` to `postgresql` (the schema was already Postgres-compatible,
no SQLite-only types were used, so this was a clean swap). The live DB is `kpindicator_prod` on
this same host. [docs/database-schema.md](docs/database-schema.md) still describes the original
SQLite-for-dev/Postgres-for-prod plan — treat `schema.prisma`'s `datasource` block as the source
of truth over that doc's wording.

### Content

`src/content/*.ts` holds typed marketing copy (packages, pricing comparison matrix, process
steps, FAQs, audience segments) — edit these, not JSX, to change marketing copy. `content/*.mdx`
(project-root, not `src/`) holds case studies and blog posts, rendered via
`next-mdx-remote`/`remark-gfm` through `src/components/mdx-content.tsx`.

### Outbound email

`src/lib/notify.ts` sends admin notifications (new contact submission, new paid signup) via AWS
SES (`SESv2Client`/`SendEmailCommand`), configured through `SES_ACCESS_KEY_ID` /
`SES_SECRET_ACCESS_KEY` / `SES_REGION` / `SES_FROM_EMAIL`. `CONTACT_NOTIFICATION_EMAIL` is a
comma-separated recipient list (supports `"Name <email>"` entries), not a single address. Without
SES credentials configured it logs instead of sending — no branching needed at call sites either
way.

### Integrations degrade gracefully

Stripe, PostHog, and SES all no-op (with a log line or a UI fallback) rather than throwing when
unconfigured — this is intentional so the app runs standalone without every third-party account
set up. Preserve that pattern when touching those integrations; don't add hard failures for
missing keys.
