import type { MetadataRoute } from "next";

import { abs, siteUrl } from "@/lib/seo";

/** Never crawlable, by any agent — private surfaces and API routes. */
const PRIVATE = ["/dashboard", "/admin", "/api", "/checkout"];

/**
 * AI crawlers, all explicitly allowed.
 *
 * These split into two jobs: training crawlers (GPTBot, ClaudeBot, CCBot,
 * Google-Extended, Applebot-Extended) and retrieval/citation crawlers
 * (OAI-SearchBot, Claude-SearchBot, PerplexityBot, ChatGPT-User). For most
 * platforms both jobs run off the same crawl, so there is no reliable way to
 * refuse training while staying eligible for citation.
 *
 * KPIndicator sells evidence to people actively researching whether to build
 * something — being the cited source in that research is free, high-intent
 * distribution. So everything is allowed on purpose. To opt out of model
 * training later, move the training agents into their own rule with
 * `disallow: "/"`, and accept losing citation eligibility on those platforms.
 */
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Meta-ExternalAgent",
  "Amazonbot",
  "Bytespider",
  "cohere-ai",
  "CCBot",
  "DuckAssistBot",
  "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE,
      })),
    ],
    sitemap: abs("/sitemap.xml"),
    host: siteUrl,
  };
}
