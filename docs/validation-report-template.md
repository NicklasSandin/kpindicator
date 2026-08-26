# Validation report template

Every report WhatHits delivers — from a $995 Idea Check assessment to a $8,500 Presale Sprint
results report — follows the same structure. Consistency matters here on purpose: a client
running five reports side by side (a Validation Sprint) should be able to compare them without
re-learning a format each time.

This structure is implemented, not just documented — see it live at
[`/dashboard/reports/[id]`](../src/app/dashboard/reports/%5Bid%5D/page.tsx) and in the `Report`
model in [`prisma/schema.prisma`](../prisma/schema.prisma).

## Structure

### 1. Letterhead
Fixed metadata, always present: prepared-by, report type, publish date, which project and
package it belongs to. Maps to `Report.publishedAt`, `Project.name`, `Project.package`.

### 2. Title
One line naming the idea and report type — e.g. *"Ledger — Validation Report"* or, for a
portfolio-level report covering multiple ideas, *"Q2 Idea Batch — Final Validation Report."*
Maps to `Report.title`.

### 3. Executive summary
One or two sentences. No hedging, no "it's complicated" — someone who reads only this line
should know what happened and what we recommend. Maps to `Report.summary`.

### 4. Recommendation banner
One of four states, visually distinct so it can't be missed or reframed after the fact:

| Recommendation | Meaning |
|---|---|
| **Go** | Cleared the pre-agreed threshold. Proceed. |
| **No-go** | Did not clear the threshold. Stop or fundamentally re-scope. |
| **Pivot** | The underlying need has signal; the current framing doesn't. Re-angle and re-test. |
| **More data needed** | Landed in a genuine gray zone. Recommended: a short, isolated follow-up — not a guess. |

Maps to `Report.recommendation` (a Prisma enum, not a free-text field — this is deliberate, so a
report can't quietly avoid taking a position). Implementation:
[`recommendation-banner.tsx`](../src/components/dashboard/recommendation-banner.tsx).

### 5. Key metrics snapshot
For an idea-level report: visitors, leads, conversion rate, and preorders/deposits, aggregated
across every campaign that tested the idea. For a portfolio report: a comparison table across
all ideas in the batch (see the Q2 Idea Batch sample report for the pattern). Computed via
[`sumMetrics()`](../src/lib/metrics.ts), never hand-entered — the numbers in the report are the
same numbers the client can see live on the dashboard mid-test.

### 6. Full narrative body
Markdown/MDX, rendered with GitHub-flavored tables (`remark-gfm`). Consistent sub-sections,
though not every report needs every one:

- **The situation** — why this idea, why now, what was at stake in the decision
- **What we tested** — positioning variants, pricing, channels, audience
- **What happened** — the numbers, in context (vs. category benchmark, vs. the other ideas in
  the batch, vs. the pre-agreed threshold)
- **The call / Recommendation** — the specific next action, not just the verdict
- **Risks / caveats** — what could make this wrong (small sample, one channel skewing the
  blend, an unverified list) — included even when the answer is Go

### 7. Footer
Prepared-by line restating the project and the date the recommendation reflects, so a report
read six months later is self-dating.

## Field reference (`Report` model)

| Field | Purpose |
|---|---|
| `title` | Report headline |
| `recommendation` | `GO` \| `NO_GO` \| `PIVOT` \| `MORE_DATA_NEEDED` |
| `summary` | One-line executive summary |
| `body` | Full Markdown/MDX narrative |
| `ideaId` | Set for a per-idea report; `null` for a project-level portfolio report |
| `fileUrl` | Optional link to an exported PDF (the dashboard also offers browser print-to-PDF via `ReportPrintButton` — no PDF generation service required to demo this) |
| `publishedAt` | Distinct from `createdAt` — a report can be drafted before it's shared with the client |

## Worked examples

Four fully written sample reports ship in the seed data
([`prisma/seed.ts`](../prisma/seed.ts)) covering all four recommendation states — Ledger (Go),
Homebase Pro (No-go), Fleetwise and PitchDeck AI (More data needed) — plus one portfolio-level
report tying all four together. Run `npm run db:seed` and visit `/dashboard/reports` to read
them.
