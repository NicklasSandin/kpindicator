export type AlternativeId = "build-first" | "interviews" | "ai-tools" | "kpindicator";

export interface AlternativeRow {
  feature: string;
  values: Record<AlternativeId, string>;
}

export const ALTERNATIVES: { id: AlternativeId; name: string; featured?: boolean }[] = [
  { id: "build-first", name: "Build it, then find out" },
  { id: "interviews", name: "Customer interviews & surveys" },
  { id: "ai-tools", name: "AI “validation” tools" },
  { id: "kpindicator", name: "KPIndicator", featured: true },
];

export const ALTERNATIVE_ROWS: AlternativeRow[] = [
  {
    feature: "What you're actually measuring",
    values: {
      "build-first": "Whether it works, after it's built",
      interviews: "What people say they'd do",
      "ai-tools": "What a model predicts they'd do",
      kpindicator: "What real people click, sign up for, and pay toward",
    },
  },
  {
    feature: "Real money changes hands",
    values: {
      "build-first": "Only yours — all of it, upfront",
      interviews: "No",
      "ai-tools": "No",
      kpindicator: "Yes — real ad spend, real deposits",
    },
  },
  {
    feature: "Typical cost to reach an answer",
    values: {
      "build-first": "$50k–$250k+",
      interviews: "Low, but the answer isn't reliable",
      "ai-tools": "$0–$50",
      kpindicator: "$995–$2,500 per idea",
    },
  },
  {
    feature: "Time to a clear answer",
    values: {
      "build-first": "3–12 months",
      interviews: "1–2 weeks of conversation",
      "ai-tools": "Minutes",
      kpindicator: "1–4 weeks of real testing",
    },
  },
  {
    feature: "Who owns the result",
    values: {
      "build-first": "You — including a product nobody wanted",
      interviews: "A stack of notes open to interpretation",
      "ai-tools": "A vendor's model, not your market",
      kpindicator: "You — domain, data, leads, and report",
    },
  },
];
