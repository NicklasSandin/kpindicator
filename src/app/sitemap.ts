import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";

import { getCaseStudies, getBlogPosts } from "@/lib/content";
import { abs } from "@/lib/seo";

type Route = {
  path: string;
  /** Source file, used to derive a real lastModified from its mtime. */
  file: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const STATIC_ROUTES: Route[] = [
  { path: "", file: "(marketing)/page.tsx", changeFrequency: "weekly", priority: 1 },
  { path: "/validate", file: "(marketing)/validate/page.tsx", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", file: "(marketing)/pricing/page.tsx", changeFrequency: "weekly", priority: 0.9 },
  { path: "/grow", file: "(marketing)/grow/page.tsx", changeFrequency: "weekly", priority: 0.8 },
  { path: "/incorporate", file: "(marketing)/incorporate/page.tsx", changeFrequency: "monthly", priority: 0.7 },
  { path: "/process", file: "(marketing)/process/page.tsx", changeFrequency: "monthly", priority: 0.7 },
  { path: "/case-studies", file: "(marketing)/case-studies/page.tsx", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", file: "(marketing)/about/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/blog", file: "(marketing)/blog/page.tsx", changeFrequency: "weekly", priority: 0.6 },
  { path: "/contact", file: "(marketing)/contact/page.tsx", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", file: "(marketing)/privacy/page.tsx", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", file: "(marketing)/terms/page.tsx", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Real mtime per route instead of `new Date()` on everything.
 *
 * Stamping every URL with the build time tells a crawler the entire site
 * changed on every deploy, which trains it to ignore the field. Falling back
 * to now() only if the file cannot be read.
 */
function lastModified(relativeFile: string): Date {
  try {
    return fs.statSync(path.join(process.cwd(), "src", "app", relativeFile)).mtime;
  } catch {
    return new Date();
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: abs(route.path || "/"),
    lastModified: lastModified(route.file),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const caseStudyEntries = getCaseStudies().map((cs) => ({
    url: abs(`/case-studies/${cs.slug}`),
    lastModified: new Date(cs.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const blogEntries = getBlogPosts().map((post) => ({
    url: abs(`/blog/${post.slug}`),
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...caseStudyEntries, ...blogEntries];
}
