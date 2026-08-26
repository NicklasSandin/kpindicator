# WhatHits

Done-for-you market validation and product-building. We test 3-5 of your ideas with real
landing pages and real traffic, tell you what actually converts, and build the one that hits.

This repo is the full marketing site + client dashboard, built to run standalone with a local
SQLite database and demo data — no external accounts required to see it working end to end.

## Stack

- **Next.js 15** (App Router) + **TypeScript**, pinned deliberately — `create-next-app@latest`
  currently resolves to Next 16; see the note in `docs/` history / commit log if reconciling.
- **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`) + **shadcn/ui** (Nova preset —
  Radix primitives, Lucide icons, Geist font)
- **Prisma 6** + **SQLite** for local dev (swap the datasource for Postgres in production — see
  [`docs/database-schema.md`](docs/database-schema.md))
- **Stripe** for checkout (works without keys configured — see [Stripe setup](#stripe))
- **PostHog** for analytics (no-ops without a key configured)
- **MDX** (`next-mdx-remote` + `remark-gfm`) for case studies and blog content — see
  [`content/`](content)
- **next-themes** for dark/light mode (defaults to dark)

## Getting started

```bash
npm install
cp .env.example .env
npm run db:migrate   # creates prisma/dev.db and applies migrations
npm run db:seed       # loads demo client, projects, ideas, campaigns, reports
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the marketing site,
[http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the client portal, and
[http://localhost:3000/admin](http://localhost:3000/admin) for the internal email-campaign
tracker (see [Auth note](#auth-note) below — neither portal has real auth yet).

## Project structure

```
src/
  app/
    (marketing)/        Marketing site pages — shares src/app/(marketing)/layout.tsx
      page.tsx           Home
      pricing/           Pricing + comparison table
      process/           8-step process
      about/
      contact/           Contact form → /api/contact
      case-studies/       Index + [slug] detail (reads content/case-studies/*.mdx)
      blog/               Index + [slug] detail (reads content/blog/*.mdx)
      privacy/, terms/
    dashboard/            Client portal — separate layout (sidebar, no marketing header/footer)
      page.tsx             Overview
      projects/[id]/       Ideas, campaigns, live metrics for one project
      reports/[id]/         Full validation report (see docs/validation-report-template.md)
    admin/                 Internal-only — WhatHits' own email marketing (not client-facing)
      page.tsx               Overview across all campaigns
      campaigns/[id]/         Funnel + per-recipient opens/clicks (see docs/email-campaigns.md)
      campaigns/new/          Create a campaign + paste in a recipient list
    api/
      checkout/            Creates a Stripe Checkout Session
      webhooks/stripe/      Records paid Orders
      webhooks/email/       Provider-agnostic engagement-event ingestion (opens/clicks/bounces)
      contact/              Persists ContactSubmission rows
      admin/email-campaigns/  Creates a draft EmailCampaign + recipients
    layout.tsx            Root layout: fonts, theme provider, analytics, toaster
  components/
    ui/                  shadcn/ui primitives
    portal/                Shared sidebar/mobile-nav shell used by both /dashboard and /admin
    marketing/            Site header/footer, hero, pricing cards, FAQ, etc.
    dashboard/            Client-portal-specific pieces (report banner, print button)
    admin/                 Email funnel, recipient table, new-campaign form
  content/               Typed content: packages, pricing comparison matrix, process steps, FAQs
  lib/                   prisma client, stripe client, format/metrics helpers
content/
  case-studies/*.mdx      3 illustrative case studies (frontmatter + MDX body)
  blog/*.mdx               2 blog posts
prisma/
  schema.prisma            Full data model — see docs/database-schema.md
  seed.ts                   Deterministic demo data (same output every reseed)
docs/
  database-schema.md        Schema rationale + ER diagram
  user-flows.md              4 key flows, with diagrams, mapped to real routes/code
  validation-report-template.md   The report template structure, field by field
  email-campaigns.md          Email tracking: what's built, how to wire a real ESP later
  brand-and-domains.md       Domain suggestions for whathits.*
```

## Environment variables

See [`.env.example`](.env.example) for the full list with comments. Nothing is required to run
the app locally — every integration (Stripe, PostHog) degrades gracefully without keys.

## Stripe

Checkout works out of the box in a "not configured" state: clicking a package's checkout button
without `STRIPE_SECRET_KEY` set shows a toast explaining payments aren't wired up yet, with a
fallback to the contact form — the flow never throws to the client.

To go live:

1. Create a Stripe account, get test keys from the [Stripe dashboard](https://dashboard.stripe.com/apikeys)
2. Create one Product + Price per package, set the four `STRIPE_PRICE_*` env vars (checkout
   falls back to an ad-hoc `price_data` object using the price in
   [`src/content/packages.ts`](src/content/packages.ts) if a Price ID isn't set, so it works
   end-to-end before the Stripe catalog is built out)
3. Point a Stripe webhook at `/api/webhooks/stripe` for `checkout.session.completed`, set
   `STRIPE_WEBHOOK_SECRET`

## Email campaign tracking

`/admin` is where WhatHits' own outbound marketing (emailing prospective clients) gets tracked —
opens, clicks, bounces, and a per-recipient breakdown of who's engaging. It's separate from a
client's idea being tested via email as part of their project (that's `Channel.EMAIL` in the main
schema). No email provider is wired up for sending yet; see
[`docs/email-campaigns.md`](docs/email-campaigns.md) for what's built now, what's deliberately
not, and how to connect a real ESP once one's chosen.

## Auth note

Neither portal has real authentication — both are placeholders reading live rows from the
database. `/dashboard` reads one seeded demo client (`jordan@northbeamstudio.co`) through
[`getCurrentUser()`](src/lib/current-user.ts); `/admin` reads one seeded internal user
(`ops@whathits.co`) through [`getCurrentAdmin()`](src/lib/current-admin.ts). Every page in each
portal reads through its one function, so swapping in real auth (NextAuth, Clerk, etc.) means
changing those two files, not every page.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations (creates `prisma/dev.db` on first run) |
| `npm run db:seed` | Reset + reload demo data (safe to re-run — deterministic output) |
| `npm run db:studio` | Prisma Studio — browse the local database in a UI |

## Design notes

Dark-first (defaults to dark, light mode fully supported — toggle in the header). Warm amber
signal accent as the brand color; green/amber/red are reserved *only* for go/no-go/testing
status badges, kept deliberately separate from the brand color so a validated-idea badge always
reads as data, not marketing. See [`src/app/globals.css`](src/app/globals.css) for the full
token set and [`docs/brand-and-domains.md`](docs/brand-and-domains.md#naming-rationale-for-context-not-action)
for the reasoning.
