import { PACKAGES } from "@/content/packages";
import type { BlogPost, CaseStudy } from "@/lib/content";

/** Single source of truth for absolute URLs. */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const abs = (path = "") => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

export const SITE = {
  name: "KPIndicator",
  legalName: "KPIndicator",
  tagline: "Test what hits before you build it",
  description:
    "Done-for-you market validation. KPIndicator runs real landing pages and real traffic against your 3–5 best ideas, measures what actually converts, and hands you a written go / no-go before you spend on a build.",
  email: "hello@kpindicator.co",
  /** Fill these in as the accounts go live — an empty sameAs is better than a wrong one. */
  sameAs: [] as string[],
} as const;

/**
 * JSON-LD is only worth adding for claims that are actually true and
 * verifiable. Anything speculative (fake reviews, aggregate ratings, invented
 * founding dates) gets filtered by search and answer engines and costs trust,
 * so nothing below is asserted that the site cannot back up.
 *
 * Deliberately NOT emitted:
 *   - FAQPage — Google retired FAQ rich results on 7 May 2026 and restricted
 *     the type to government and health domains. Marking up an agency FAQ now
 *     is schema spam with no upside.
 *   - Review / AggregateRating — the case studies are flagged `illustrative`
 *     in their frontmatter. They are not client testimonials and must never
 *     be marked up as though they were.
 */

type Json = Record<string, unknown>;

export function organizationSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": abs("/#organization"),
    name: SITE.name,
    legalName: SITE.legalName,
    url: abs("/"),
    logo: {
      "@type": "ImageObject",
      url: abs("/icon"),
      width: 512,
      height: 512,
    },
    image: abs("/opengraph-image"),
    description: SITE.description,
    email: SITE.email,
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: SITE.email,
      url: abs("/contact"),
      availableLanguage: ["en"],
    },
    knowsAbout: [
      "Market validation",
      "Demand testing",
      "Landing page testing",
      "Product-market fit",
      "Go-to-market strategy",
      "Company formation",
    ],
  };
}

export function websiteSchema(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#website"),
    name: SITE.name,
    url: abs("/"),
    description: SITE.description,
    publisher: { "@id": abs("/#organization") },
    inLanguage: "en",
  };
}

/** One Service node per package, each carrying a real, published price. */
export function serviceSchemas(): Json[] {
  return PACKAGES.map((pkg) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": abs(`/pricing#${pkg.id}`),
    name: pkg.name,
    serviceType: "Market validation",
    description: pkg.description,
    provider: { "@id": abs("/#organization") },
    areaServed: "Worldwide",
    offers: {
      "@type": "Offer",
      price: ((pkg.introPriceCents ?? pkg.priceCents) / 100).toFixed(2),
      priceCurrency: "USD",
      url: abs(`/pricing#${pkg.id}`),
      availability: "https://schema.org/InStock",
    },
  }));
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  };
}

export function blogPostingSchema(post: BlogPost): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": abs(`/blog/${post.slug}#article`),
    headline: post.title,
    description: post.dek,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Organization", name: post.author, url: abs("/about") },
    publisher: { "@id": abs("/#organization") },
    mainEntityOfPage: abs(`/blog/${post.slug}`),
    inLanguage: "en",
    isAccessibleForFree: true,
  };
}

/**
 * Case studies are marked up as Article, never Review. `illustrative: true`
 * in the frontmatter means these are composite scenarios, so `disambiguating
 * Description` states that plainly rather than letting a crawler infer that
 * they are named client results.
 */
export function caseStudySchema(study: CaseStudy): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": abs(`/case-studies/${study.slug}#article`),
    headline: study.title,
    description: study.dek,
    datePublished: study.publishedAt,
    dateModified: study.publishedAt,
    author: { "@id": abs("/#organization") },
    publisher: { "@id": abs("/#organization") },
    mainEntityOfPage: abs(`/case-studies/${study.slug}`),
    inLanguage: "en",
    isAccessibleForFree: true,
    ...(study.illustrative
      ? {
          disambiguatingDescription:
            "Illustrative scenario based on the KPIndicator process, not a named client engagement.",
        }
      : {}),
  };
}
