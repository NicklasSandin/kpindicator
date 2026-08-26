# Brand & domains

**Name: KPIndicator** — locked in. The rest of this doc is domain options for it, not alternate
names. (If a backup name is ever needed, the "what actually converts" territory — Signal,
Backtest, Traction Check, Demand Line, Greenlit — is worth a second pass, but KPIndicator already
does the job a name needs to do: it fuses "KPI," the standard shorthand for the metrics this
business lives or dies by, with "Indicator" — the plain-English word for a go/no-go signal —
so the name itself says *this is where the numbers tell you whether it works.*)

Domain names below are suggestions to check on a registrar (Namecheap, Porkbun, Google Domains,
etc.) or via WHOIS before committing — availability changes and isn't something to take as
verified from this list.

## Primary candidates

| Domain | Read |
|---|---|
| **kpindicator.com** | The one to actually pursue first. If taken, check for an active site vs. a parked page — sometimes purchasable. |
| **kpindicator.io** | Strong fallback; `.io` reads as "tech/startup tool" which fits, though slightly undercuts the "agency, not tool" positioning. |
| **kpindicator.co** | Clean, short, reads fine spoken aloud. Used as the placeholder domain throughout this codebase's sample data (`get.kpindicator.co`, `hello@kpindicator.co`). |
| **gokpindicator.com** | Fallback pattern if the bare name is taken — the "go" doubles nicely as a nod to the go/no-go language used everywhere on the site. |
| **kpindicator.app** | Only if leaning more product/tool than agency in future positioning. |

## Subdomain pattern for client landing pages

The product itself provisions a subdomain or path per tested idea (see the "Landing page +
tracking setup" step in the process, and `Idea.landingPageUrl` in the schema). Recommended
pattern, already used in the seed data:

```
get.kpindicator.co/<idea-slug>       e.g. get.kpindicator.co/ledger
```

Keeps every test's landing page on infrastructure you control (fast DNS/SSL setup, one
analytics property, no per-client domain purchase) while still letting a landing page carry the
client's own brand in its on-page copy and design, not KPIndicator's.

## Naming rationale (for context, not action)

The brief's requirement — professional, results-driven, "high-signal agency + product studio
hybrid," not "another cheap AI validation tool" — is mostly a *tone* problem, not a *name*
problem. KPIndicator clears the tone bar because both halves of the compound are familiar,
literal business vocabulary rather than a coined SaaS name (-ify, -ly, -io-as-a-word) that reads
as trying too hard. The visual identity leans into that same restraint — see the theming
decisions in
[`globals.css`](../src/app/globals.css): a warm signal-amber accent used sparingly against
near-black, semantic green/amber/red reserved *only* for go/no-go/testing status — not doubled
up as the brand color, so "this idea is validated" always reads as data, never as marketing.
