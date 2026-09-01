import assert from "node:assert/strict";
import test from "node:test";
import { sumMetrics } from "../src/lib/metrics";

test("project metrics separate visits, leads, qualified actions, and preorders", () => {
  const base = { campaignId: "campaign", date: new Date(), notes: null, createdAt: new Date() };
  const totals = sumMetrics([
    { ...base, id: "one", visitors: 100, leads: 10, signups: 4, preorders: 1, spendCents: 50000 },
    { ...base, id: "two", visitors: 50, leads: 5, signups: 2, preorders: 0, spendCents: 25000 },
  ]);
  assert.deepEqual(totals, {
    visitors: 150,
    leads: 15,
    signups: 6,
    preorders: 1,
    spendCents: 75000,
    conversionRate: 10,
    costPerLeadCents: 5000,
  });
});
