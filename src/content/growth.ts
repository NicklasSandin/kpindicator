export interface GrowthPackage {
  id: "growth-check" | "growth-test" | "growth-sprint";
  name: string;
  priceCents: number;
  tagline: string;
  description: string;
  duration: string;
  includes: string[];
  featured?: boolean;
}

export const GROWTH_PACKAGES: GrowthPackage[] = [
  {
    id: "growth-check",
    name: "Growth Check",
    priceCents: 99500,
    tagline: "Know what's actually stalling growth before you spend on it.",
    description:
      "A structured audit of your existing funnel, positioning, and channels — so the next dollar you spend on growth is aimed at the highest-leverage problem, not a guess.",
    duration: "3-5 business days",
    includes: [
      "Conversion funnel & analytics review",
      "Competitor positioning scan",
      "Channel and pricing gap analysis",
      "Written recommendation: what to test next, and why",
    ],
  },
  {
    id: "growth-test",
    name: "Growth Test",
    priceCents: 250000,
    tagline: "Put one growth bet in front of real traffic and watch what happens.",
    description:
      "We build and ship one specific change — new positioning, a new feature angle, a new channel, or a new price — and test it against real traffic, measured against your current baseline.",
    duration: "2 weeks",
    includes: [
      "Variant page or offer build",
      "Analytics + conversion tracking wired to your existing product",
      "Real paid traffic campaign",
      "Before/after performance comparison",
    ],
    featured: true,
  },
  {
    id: "growth-sprint",
    name: "Growth Sprint",
    priceCents: 490000,
    tagline: "Test 3-5 growth bets in parallel, kill the losers, double down on what hits.",
    description:
      "The same batch-testing model as our Validation Sprint, aimed at a product that already exists: multiple positioning angles, features, channels, or expansion markets tested head-to-head instead of shipped one at a time on a hunch.",
    duration: "3-4 weeks",
    includes: [
      "Everything in Growth Test, per bet",
      "Multi-channel testing (paid + email + outreach)",
      "Head-to-head comparison across bets",
      "Final ranked report: what to double down on",
    ],
  },
];

export const GROWTH_FOR_YOU = [
  {
    title: "SaaS founders whose growth has plateaued",
    detail: "You have users and revenue, but the last quarter looks like the one before it, and nobody's sure why.",
    icon: "trending-up",
  },
  {
    title: "Teams debating which feature to build next",
    detail: "You have three roadmap candidates and one engineering team. We tell you which one the market actually wants before you build any of them.",
    icon: "layers",
  },
  {
    title: "Products with users but flat activation or conversion",
    detail: "Traffic shows up, and most of it leaves. We isolate whether that's a positioning problem, a pricing problem, or a channel problem.",
    icon: "rocket",
  },
  {
    title: "Post-launch startups weighing a new market or segment",
    detail: "Before you localize, re-price, or rebuild for a new ICP, test whether that market actually responds — with real traffic, not a hunch.",
    icon: "globe",
  },
] as const;

export const GROWTH_FAQS = [
  {
    question: "We already have analytics. Why do we need this?",
    answer:
      "Analytics tell you what happened. They don't tell you what would happen if you changed your pricing, swapped your headline, or opened a new channel — because you haven't tried it yet. We run the actual experiment instead of extrapolating from a dashboard.",
  },
  {
    question: "Do you need access to our codebase or production environment?",
    answer:
      "Rarely. Most Growth Tests run on a variant landing page or a gated experience alongside your existing product, so we're not touching your production code. If a test does require a product change, we scope that with your team upfront.",
  },
  {
    question: "What if the current version is already winning?",
    answer:
      "Then you've confirmed it cheaply, and you keep shipping what works with actual evidence instead of assumption. A test that confirms your instinct is still a useful test — it just cost a lot less than being wrong would have.",
  },
  {
    question: "Can this replace our marketing team, or does it work alongside them?",
    answer:
      "Alongside. We're not running your always-on channels — we're isolating one specific bet at a time and telling you, with data, whether it's worth your team's ongoing investment. Think of it as R&D for your growth roadmap, not a replacement for execution.",
  },
] as const;
