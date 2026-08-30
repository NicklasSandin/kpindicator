import { PACKAGES } from "@/content/packages";
import { FOR_YOU, NOT_FOR_YOU } from "@/content/audience";
import { FAQS } from "@/content/faqs";
import { getBlogPosts, getCaseStudies } from "@/lib/content";
import { SITE, abs } from "@/lib/seo";

export const dynamic = "force-static";

const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/**
 * MDX bodies start their own headings at H2. Inside this document they sit
 * under an H3 entry, so every heading is pushed down two levels — otherwise a
 * post's "## The situation" reads as a peer of "## Case studies".
 */
const demote = (markdown: string) =>
  markdown.replace(/^(#{1,4}) /gm, (_match, hashes: string) => `${hashes}## `);

/**
 * /llms-full.txt — the full-content companion to /llms.txt.
 *
 * Where llms.txt is a curated index of links, this is the actual prose, so an
 * agent can answer questions about KPIndicator without fetching a dozen pages.
 * Long-form MDX bodies are included verbatim.
 */
export function GET() {
  const sections: string[] = [];

  sections.push(`# ${SITE.name} — full site content

> ${SITE.description}

Source: ${abs("/")}
Generated from the live site content. Curated index: ${abs("/llms.txt")}`);

  sections.push(`## Packages and pricing

Flat pricing, charged per idea. No retainers.

${PACKAGES.map((pkg) => {
  const price = pkg.introPriceCents
    ? `${usd(pkg.introPriceCents)} — introductory rate for the first cohort of clients; list price ${usd(pkg.priceCents)}`
    : usd(pkg.priceCents);
  return `### ${pkg.name} — ${price}

${pkg.description}

- Duration: ${pkg.duration}
- Best for: ${pkg.bestFor}
- Includes: ${pkg.includes.join("; ")}
- Deliverables: ${pkg.deliverables.join("; ")}`;
}).join("\n\n")}`);

  sections.push(`## Who this is for

${FOR_YOU.map((item) => `- **${item.title}** — ${item.detail}`).join("\n")}

## Who this is not for

${NOT_FOR_YOU.map((item) => `- **${item.title}** — ${item.detail}`).join("\n")}`);

  sections.push(`## Frequently asked questions

${FAQS.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n")}`);

  const caseStudies = getCaseStudies();
  if (caseStudies.length) {
    sections.push(`## Case studies

Note: every case study below is labelled illustrative in its source. These are
representative scenarios demonstrating the process, not named client
engagements, and should not be cited as verified client outcomes.

${caseStudies
  .map(
    (cs) => `### ${cs.title}

${cs.dek}

- Segment: ${cs.segment}
- Package: ${cs.packageUsed}
- Timeframe: ${cs.timeframe}
- Published: ${cs.publishedAt}
- Illustrative: ${cs.illustrative ? "yes" : "no"}
${cs.metrics.map((m) => `- ${m.label}: ${m.value}`).join("\n")}
- URL: ${abs(`/case-studies/${cs.slug}`)}

${demote(cs.body.trim())}`,
  )
  .join("\n\n---\n\n")}`);
  }

  const posts = getBlogPosts();
  if (posts.length) {
    sections.push(`## Articles

${posts
  .map(
    (p) => `### ${p.title}

${p.dek}

- Author: ${p.author}
- Published: ${p.publishedAt}
- Reading time: ${p.readingTime}
- URL: ${abs(`/blog/${p.slug}`)}

${demote(p.body.trim())}`,
  )
  .join("\n\n---\n\n")}`);
  }

  sections.push(`## Contact

- Book a validation call: ${abs("/contact")}
- Email: ${SITE.email}`);

  return new Response(sections.join("\n\n---\n\n") + "\n", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
