import type { PackageId } from "@/content/packages";

type Cell = boolean | string;

export interface ComparisonRow {
  feature: string;
  values: Record<PackageId, Cell>;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Ideas covered",
    values: {
      "idea-check": "1 idea",
      "market-test": "1 idea",
      "validation-sprint": "3-5 ideas",
      "presale-sprint": "1 idea",
    },
  },
  {
    feature: "Competitor & market research",
    values: { "idea-check": true, "market-test": false, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Pricing analysis",
    values: { "idea-check": true, "market-test": false, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Positioning & offer design",
    values: { "idea-check": false, "market-test": true, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Conversion-focused landing page",
    values: { "idea-check": false, "market-test": true, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Domain / subdomain setup",
    values: { "idea-check": false, "market-test": true, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Analytics & lead capture",
    values: { "idea-check": false, "market-test": true, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Paid traffic campaign",
    values: { "idea-check": false, "market-test": "Initial", "validation-sprint": "Full", "presale-sprint": "Full" },
  },
  {
    feature: "Email + social outreach",
    values: { "idea-check": false, "market-test": false, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Multiple offers & pricing tested",
    values: { "idea-check": false, "market-test": false, "validation-sprint": true, "presale-sprint": false },
  },
  {
    feature: "Lead qualification & interviews",
    values: { "idea-check": false, "market-test": false, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Written go / no-go report",
    values: { "idea-check": true, "market-test": false, "validation-sprint": true, "presale-sprint": true },
  },
  {
    feature: "Booked demos / preorder & deposit flow",
    values: { "idea-check": false, "market-test": false, "validation-sprint": false, "presale-sprint": true },
  },
  {
    feature: "Sales-assisted follow-up on hot leads",
    values: { "idea-check": false, "market-test": false, "validation-sprint": false, "presale-sprint": true },
  },
];
