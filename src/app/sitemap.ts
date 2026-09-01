import type { MetadataRoute } from "next";

import { getCaseStudies, getBlogPosts } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes = [
    "",
    "/pricing",
    "/process",
    "/about",
    "/contact",
    "/case-studies",
    "/blog",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));

  const caseStudyRoutes = getCaseStudies().map((cs) => ({
    url: `${siteUrl}/case-studies/${cs.slug}`,
    lastModified: new Date(cs.publishedAt),
  }));

  const blogRoutes = getBlogPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
  }));

  return [...staticRoutes, ...caseStudyRoutes, ...blogRoutes];
}
