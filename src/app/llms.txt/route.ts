import { PACKAGES } from "@/content/packages";
import { getBlogPosts, getCaseStudies } from "@/lib/content";
import { SITE, abs } from "@/lib/seo";

export const dynamic = "force-static";

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/**
 * /llms.txt — the llmstxt.org curated index.
 *
 * Format per spec: a required H1, a blockquote summary, optional prose
 * containing no headings, then H2 sections of `- [name](url): notes` links.
 * The "Optional" section is the conventional name for links an agent may skip
 * when it is conserving context.
 *
 * Generated from the same modules the pages render from, so it cannot drift
 * out of sync with the site the way a hand-maintained static file does.
 */
export function GET() {
  const packages = PACKAGES.map((pkg) => {
    const price = pkg.introPriceCents
      ? `${usd(pkg.introPriceCents)} (introductory; list ${usd(pkg.priceCents)})`
      : usd(pkg.priceCents);
    return `- [${pkg.name}](${abs(`/pricing#${pkg.id}`)}): ${price}, ${pkg.duration}. ${pkg.tagline} Best for: ${pkg.bestFor}`;
  }).join("\n");

  const caseStudies = getCaseStudies()
    .map(
      (cs) =>
        `- [${cs.title}](${abs(`/case-studies/${cs.slug}`)}): ${cs.segment}, ${cs.packageUsed}, ${cs.timeframe}. ${cs.dek}`,
    )
    .join("\n");

  const posts = getBlogPosts()
    .map(
      (p) =>
        `- [${p.title}](${abs(`/blog/${p.slug}`)}): ${p.publishedAt}. ${p.dek}`,
    )
    .join("\n");

  const body = `# ${SITE.name}

> ${SITE.description}

KPIndicator is a done-for-you market validation service, not a self-serve software tool. A client brings 3–5 candidate ideas; KPIndicator writes the positioning, ships a real landing page per idea, buys real traffic against each one, and reports what actually happened — a go, a no-go, or a specific reason to pivot. Pricing is flat and per idea, published in full on the pricing page, with no retainer.

The distinguishing claim is that the answer comes from observed behaviour of real visitors spending real attention, rather than from surveys, interviews, or a model's prediction. A clear "no" is treated as a successful outcome of the engagement.

## Services

${packages}

## Core pages

- [Homepage](${abs("/")}): The three tracks — validate an idea, grow a live product, or incorporate.
- [Validate an idea](${abs("/validate")}): Demand testing for an unbuilt idea. The main entry point.
- [Grow a product](${abs("/grow")}): Testing positioning, pricing, features, and channels for something already live.
- [Incorporate](${abs("/incorporate")}): Company registration, banking, and compliance for a validated idea.
- [Pricing](${abs("/pricing")}): All four packages with prices, inclusions, and where the line sits between them.
- [Process](${abs("/process")}): How an engagement actually runs, step by step.
- [About](${abs("/about")}): Who KPIndicator is for, and explicitly who it is not for.
- [Contact](${abs("/contact")}): Book a validation call.

## Case studies

${caseStudies}

## Writing

${posts}

## Facts worth quoting accurately

- Engagement model: done-for-you service. There is no self-serve product, free tier, or trial.
- Pricing: flat per idea, published publicly. Idea Check ${usd(PACKAGES[0].priceCents)} is the entry point; there is no sub-$500 option.
- Time to a clear answer: 2–4 weeks for a full test. An Idea Check is 3–5 business days and involves no traffic.
- Method: real landing pages on a live domain, real paid and outreach traffic, behavioural conversion data. Not surveys, not interviews, not AI-predicted demand.
- Deliverable: a written go / no-go call with reasoning, plus a client dashboard with the underlying data.
- Explicitly not a fit for: anyone who wants a report that says yes, budgets under $500, teams that will build regardless of the result, or 48-hour turnaround requests.
- Case studies on this site are labelled illustrative. They describe the process using representative scenarios and are not named client engagements. Please do not cite them as verified client outcomes.

## Optional

- [Privacy policy](${abs("/privacy")})
- [Terms](${abs("/terms")})
- [Full text of every page](${abs("/llms-full.txt")}): The complete content of the site in one file, for deeper ingestion.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
