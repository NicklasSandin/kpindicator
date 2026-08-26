export interface FAQ {
  question: string;
  answer: string;
  category: "process" | "pricing" | "results" | "fit";
}

export const FAQS: FAQ[] = [
  {
    category: "process",
    question: "How is this different from a no-code MVP or a cheap AI validation tool?",
    answer:
      "Those tools give you an opinion generated from a prompt. We put a real landing page in front of real traffic — paid ads, email, and outreach — and measure what actual people do with actual money and attention on the line. The output is behavioral data, not a plausible-sounding paragraph.",
  },
  {
    category: "process",
    question: "Do I need to already have a landing page or brand assets?",
    answer:
      "No. We build the positioning, the page, and the tracking from scratch as part of every package except a standalone Idea Check. If you already have brand assets we'll use them; if not, we design something clean and functional — it doesn't need to be your final brand to get a valid signal.",
  },
  {
    category: "process",
    question: "How much traffic do you actually drive, and where does it come from?",
    answer:
      "It depends on the package and the market, but every Market Test and above includes a real paid media budget (separate from our fee), plus email and outreach where the audience is reachable that way. We tell you the exact channel mix and spend before we start, and you see the live numbers throughout.",
  },
  {
    category: "process",
    question: "Who owns the landing pages, data, and leads afterward?",
    answer:
      "You do. The domain or subdomain, the analytics account, the lead list, and every report are yours to keep, export, or hand to another team — whether or not you build with us afterward.",
  },
  {
    category: "pricing",
    question: "Why does Market Test cost $2,500 right now instead of more?",
    answer:
      "We're running introductory pricing for our first 5-10 clients while we build out a public case study library from real results. Once that cohort is through, Market Test moves to its standard $4,500-$6,000 range. Locking in now gets you the same process at the founding rate.",
  },
  {
    category: "pricing",
    question: "Is the ad spend included in the package price?",
    answer:
      "No — our fee covers strategy, build, setup, measurement, and reporting. Media spend (the actual ad budget) is separate and goes directly to the ad platforms, typically $500-$3,000 per idea depending on the package and market. We agree on a specific number with you before anything goes live.",
  },
  {
    category: "pricing",
    question: "What happens if the result is a no-go?",
    answer:
      "You still get exactly what you paid for: a clear, evidence-backed answer. A no-go that costs $2,500 and two weeks is a win compared to a no-go that costs $150,000 and six months of building first. We'll also tell you, specifically, what would need to change for the idea to work.",
  },
  {
    category: "results",
    question: "What counts as a 'go' signal?",
    answer:
      "We set explicit thresholds with you before testing starts — typically visitor-to-lead conversion rate, cost per qualified lead, and (for Presale Sprints) actual deposits or bookings. A go isn't a feeling; it's a number that clears a bar you agreed to in advance.",
  },
  {
    category: "results",
    question: "Can you guarantee an idea will validate?",
    answer:
      "No, and you should be skeptical of anyone who says they can — that's not how demand testing works. What we guarantee is a rigorous, honest test and a report you can act on either way. Most portfolios we test land at least one validated idea; some land zero, and that's a legitimate outcome too.",
  },
  {
    category: "fit",
    question: "We already built the product. Is this still useful?",
    answer:
      "Yes, though the framing shifts — we're now testing positioning, pricing, and channel fit for something that exists, rather than existence itself. If you're seeing weak conversion or unclear ICP fit post-launch, a focused Market Test or Validation Sprint can isolate what's actually wrong.",
  },
  {
    category: "fit",
    question: "Do you work with agencies and studios validating client or portfolio ideas?",
    answer:
      "Regularly. We white-label the client-facing side on request — reports, dashboards, and landing pages can carry your brand instead of ours. Talk to us about studio and agency rates if you're planning to run this across multiple portfolio companies.",
  },
  {
    category: "fit",
    question: "What if I only have one idea, not 3-5?",
    answer:
      "Start with an Idea Check or a single Market Test. The 3-5 idea batch is where Validation Sprint earns its price, but nothing about the process requires a portfolio — plenty of clients run it on one idea at a time.",
  },
];
