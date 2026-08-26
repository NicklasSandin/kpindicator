# Key user flows

Four flows worth understanding end to end: how a visitor becomes a paying client, how a
purchased package becomes a running project, how a running project produces a result, and how a
validated result turns into a build. Each maps to real routes and data in this codebase.

## 1. Client onboarding — visitor to paid project

```mermaid
flowchart LR
    A[Marketing site visitor] --> B{Knows what they want?}
    B -- "No, needs to talk it through" --> C["/contact form\n(src/components/marketing/contact-form.tsx)"]
    B -- "Yes, ready to buy" --> D["/pricing\nselects a package"]
    C --> E[ContactSubmission row created]
    E --> F[WhatHits replies within 1 business day]
    F --> D
    D --> G["CheckoutButton → POST /api/checkout\n(src/app/api/checkout/route.ts)"]
    G --> H[Stripe Checkout Session]
    H -- success --> I["/checkout/success"]
    H -- webhook: checkout.session.completed --> J["POST /api/webhooks/stripe\ncreates/updates User + Order (PAID)"]
    I --> K[Intake call scheduled manually]
    K --> L["Project row created\n(status: INTAKE)"]
```

**Where this is soft today:** step K→L (scheduling the intake call, creating the `Project` row)
is a manual, human step — deliberately. A $995-$8,500 engagement starts with a real
conversation, not a fully automated signup flow. The `Order` and the `Project` are linked by
`userId` + timing, not a hard foreign key (see [database-schema.md](./database-schema.md#why-this-shape)).

## 2. Project lifecycle — intake to final report

This is the [8-step process](../src/content/process.ts) rendered on the marketing site, mapped
to `ProjectStatus` and `IdeaStatus`:

```mermaid
flowchart TD
    A["Project created\nstatus: INTAKE"] --> B["Ideas prioritized & ranked\n(Idea rows created, status: QUEUED)"]
    B --> C["Positioning & offer design\nstatus: POSITIONING"]
    C --> D["Landing pages + tracking built\nCampaign rows created per idea/channel"]
    D --> E["status: TESTING\nMetricSnapshot rows written daily per campaign"]
    E --> F["Lead qualification & interviews\n(status: REPORTING)"]
    F --> G{"Per idea: does it clear\nthe pre-agreed threshold?"}
    G -- yes --> H["Idea.status = VALIDATED"]
    G -- no --> I["Idea.status = INVALIDATED"]
    G -- unclear --> J["Idea.status = INCONCLUSIVE"]
    H --> K["Report created per idea\n(recommendation: GO)"]
    I --> L["Report created per idea\n(recommendation: NO_GO)"]
    J --> M["Report created per idea\n(recommendation: MORE_DATA_NEEDED / PIVOT)"]
    K --> N["Portfolio Report created\n(ideaId: null, project-level)"]
    L --> N
    M --> N
    N --> O["Project.status = COMPLETE"]
```

**Multi-idea batches (Validation Sprint) run steps D-M in parallel across 3-5 ideas** — this is
why `Idea` and `Campaign` are separate rows from `Project`, not columns on it.

## 3. Viewing results — client dashboard

```mermaid
flowchart LR
    A["/dashboard\n(overview)"] --> B["Project cards\n(status badge, idea/report counts)"]
    B --> C["/dashboard/projects/[id]\nper-idea metrics rollup"]
    C --> D{"Report published\nfor this idea?"}
    D -- yes --> E["/dashboard/reports/[id]\nfull report: recommendation banner,\nmetrics snapshot, MDX body"]
    D -- no --> F["Idea still testing —\nlive metrics only, no report link yet"]
    A --> G["/dashboard/reports\nall reports across all projects"]
    G --> E
```

Every number on these pages is a live Prisma query (`export const dynamic = "force-dynamic"`
on the dashboard layout — see [database-schema.md](./database-schema.md#where-its-read)), not a
static snapshot from build time.

## 4. Build handoff — validated idea to build kickoff

```mermaid
flowchart LR
    A["Idea.status = VALIDATED\n(Report: recommendation GO)"] --> B{"Client wants\nstronger proof first?"}
    B -- "Yes — de-risk further" --> C["New Project created\npackage: PRESALE_SPRINT"]
    C --> D["Same idea re-tested for\ndeposits / booked demos / preorders"]
    D --> E["Presale Report\n(revenue committed, demos booked)"]
    B -- "No — proceed directly" --> F["Build engagement scoped\n(outside this app's schema —\nseparate contract/SOW)"]
    E --> F
    F --> G["Client owns: domain, landing page,\nlead list, every report\n— regardless of who builds it"]
```

The seed data (`prisma/seed.ts`) models exactly this: **Project A** (Q2 Idea Batch, Validation
Sprint, `COMPLETE`) validates Ledger, and **Project B** (Ledger — Presale Sprint, `TESTING`) is
that same idea one step further down this flow — a second `Project` row, not a status change on
the first, because it's a separately-scoped, separately-billed engagement.
