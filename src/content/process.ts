export interface ProcessStep {
  step: number;
  title: string;
  summary: string;
  detail: string;
  duration: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: 1,
    title: "Intake & idea prioritization",
    summary: "We rank your 3-5 ideas so testing order isn't a guess.",
    detail:
      "You bring the ideas — usually 3 to 5. We run a structured intake call, score each one on market size, urgency, and how cheaply we can get a real signal, then sequence the test plan so budget goes where it'll teach you the most first.",
    duration: "Day 1-2",
  },
  {
    step: 2,
    title: "Positioning & offer design",
    summary: "One sharp offer per idea, not a vague description of a feature.",
    detail:
      "A vague idea gets a vague response. For each idea we write a specific offer — who it's for, what it replaces, what it costs — and draft 2-3 positioning angles to test against each other instead of betting on one.",
    duration: "Day 2-4",
  },
  {
    step: 3,
    title: "Landing page + tracking setup",
    summary: "A real page on a real domain, instrumented from day one.",
    detail:
      "We build a conversion-focused landing page per idea, put it on your domain or a subdomain we provision, and wire up analytics and lead capture before a single visitor arrives — so every click is a data point, not a vibe.",
    duration: "Day 3-6",
  },
  {
    step: 4,
    title: "Multi-channel demand testing",
    summary: "Paid ads, email, and social outreach — run in parallel, not sequence.",
    detail:
      "We put real budget and real outreach behind each idea: paid social and search, cold and warm email, and direct outreach where it fits the audience. Different channels surface different objections — one channel alone can lie to you.",
    duration: "Week 1-3",
  },
  {
    step: 5,
    title: "Real-time measurement",
    summary: "You watch what's happening, not what we tell you happened.",
    detail:
      "Every visitor, click, and lead flows into a dashboard you have access to from day one. No black box, no waiting for a Friday report — you can see which idea is pulling ahead in real time.",
    duration: "Ongoing",
  },
  {
    step: 6,
    title: "Lead qualification & interviews",
    summary: "A form fill isn't demand. We talk to the people who raised their hand.",
    detail:
      "We qualify inbound leads and run short interviews with a sample of them to understand why they clicked, what they'd expect to pay, and what would stop them from buying — the context a conversion number alone can't give you.",
    duration: "Week 2-4",
  },
  {
    step: 7,
    title: "Final validation report",
    summary: "A clear recommendation, with the evidence attached.",
    detail:
      "One written report per idea (and one portfolio summary if you tested a batch): what we tested, what happened, what it means, and a straight go / no-go / needs-more-data call. No hedging paragraph that avoids taking a position.",
    duration: "Final 2-3 days",
  },
  {
    step: 8,
    title: "Build the winner (optional)",
    summary: "If it hits, we're already set up to build it.",
    detail:
      "For ideas that validate, we can move directly into build — same team, same context, no re-onboarding a new agency from zero. You only pay to build what already has proof someone will pay for it.",
    duration: "Scoped separately",
  },
];
