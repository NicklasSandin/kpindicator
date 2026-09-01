export type PackageId =
  | "idea-check"
  | "market-test"
  | "validation-sprint"
  | "presale-sprint";

export interface PackageDef {
  id: PackageId;
  /** Must match the PackageType enum in prisma/schema.prisma. */
  dbType: "IDEA_CHECK" | "MARKET_TEST" | "VALIDATION_SPRINT" | "PRESALE_SPRINT";
  name: string;
  priceCents: number;
  introPriceCents?: number;
  tagline: string;
  description: string;
  duration: string;
  bestFor: string;
  includes: string[];
  deliverables: string[];
  /** env var name holding this package's Stripe Price ID */
  stripePriceEnvVar: string;
  featured?: boolean;
}

export const PACKAGES: PackageDef[] = [
  {
    id: "idea-check",
    dbType: "IDEA_CHECK",
    name: "Idea Check",
    priceCents: 99500,
    tagline: "Know if it's worth building before you spend a dollar on it.",
    description:
      "A fast, structured gut-check on one idea: who else is already solving this, whether the market can actually pay, and what it should cost. No traffic, no landing page — just the desk research that should happen before either of those.",
    duration: "3-5 business days",
    bestFor: "A single idea you need a fast, honest read on before committing budget.",
    includes: [
      "Competitor research (direct + adjacent)",
      "Target market sizing and analysis",
      "Pricing analysis and positioning gap map",
      "Written go / no-go assessment with reasoning",
    ],
    deliverables: [
      "1 written assessment (PDF + dashboard)",
      "Competitor teardown table",
      "Recommended price range",
    ],
    stripePriceEnvVar: "STRIPE_PRICE_IDEA_CHECK",
  },
  {
    id: "market-test",
    dbType: "MARKET_TEST",
    name: "Market Test",
    priceCents: 250000,
    tagline: "Put one idea in front of real people and watch what happens.",
    description:
      "We build the positioning, ship a real landing page on your own domain or a subdomain, wire up analytics and lead capture, and run an initial paid traffic campaign so you get actual visitor and conversion data — not a guess.",
    duration: "2 weeks",
    bestFor: "One idea, ready to see real demand signal, not just opinions.",
    includes: [
      "Positioning and offer draft",
      "Conversion-focused landing page",
      "Domain or subdomain setup",
      "Analytics + lead capture wired up",
      "Initial paid traffic campaign",
    ],
    deliverables: [
      "1 live landing page",
      "Traffic + conversion dashboard access",
      "Campaign performance summary",
    ],
    stripePriceEnvVar: "STRIPE_PRICE_MARKET_TEST",
    featured: true,
  },
  {
    id: "validation-sprint",
    dbType: "VALIDATION_SPRINT",
    name: "Validation Sprint",
    priceCents: 490000,
    tagline: "Test 3-5 ideas at once, kill the losers, double down on what hits.",
    description:
      "Our core offer. Everything in Market Test, run in parallel across multiple ideas, with outreach added on top of paid and organic traffic, multiple offer variants tested against each other, and lead qualification so 'converted' means something. Ends with one report ranking every idea.",
    duration: "3-4 weeks",
    bestFor: "Founders and teams choosing between several directions, or studios validating a batch.",
    includes: [
      "Everything in Market Test, per idea",
      "Multi-channel outreach (email + social + direct)",
      "Multiple offers and pricing tested head-to-head",
      "Lead qualification, not just lead counting",
      "Final ranked report across all ideas tested",
    ],
    deliverables: [
      "Up to 5 live landing pages",
      "Per-idea go / no-go report",
      "One portfolio-level recommendation",
      "Qualified lead list, exported",
    ],
    stripePriceEnvVar: "STRIPE_PRICE_VALIDATION_SPRINT",
  },
  {
    id: "presale-sprint",
    dbType: "PRESALE_SPRINT",
    name: "Presale Sprint",
    priceCents: 850000,
    tagline: "Stop asking if they'd buy it. Get them to actually put money down.",
    description:
      "For an idea that's already shown signal and needs the strongest possible proof: real deposits, booked demos, or conditional preorders. This is the closest thing to shipping without shipping — commercial proof, not survey answers.",
    duration: "4-6 weeks",
    bestFor: "A validated idea you're about to greenlight for build, and want investor- or board-grade proof first.",
    includes: [
      "Full demand-gen campaign across paid, email, and outreach",
      "Booked demo or deposit-collection flow",
      "Conditional preorder mechanics (refundable deposits)",
      "Sales-assisted follow-up on high-intent leads",
      "Presale results report with revenue committed",
    ],
    deliverables: [
      "Live preorder / booking flow",
      "Booked demo calendar",
      "Presale revenue and commitment report",
    ],
    stripePriceEnvVar: "STRIPE_PRICE_PRESALE_SPRINT",
  },
];

export function getPackage(id: PackageId) {
  const pkg = PACKAGES.find((p) => p.id === id);
  if (!pkg) throw new Error(`Unknown package: ${id}`);
  return pkg;
}
