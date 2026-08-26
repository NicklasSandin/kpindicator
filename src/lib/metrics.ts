import type { MetricSnapshot } from "@prisma/client";

export interface MetricTotals {
  visitors: number;
  leads: number;
  signups: number;
  preorders: number;
  spendCents: number;
  conversionRate: number;
  costPerLeadCents: number | null;
}

export function sumMetrics(snapshots: MetricSnapshot[]): MetricTotals {
  const totals = snapshots.reduce(
    (acc, s) => ({
      visitors: acc.visitors + s.visitors,
      leads: acc.leads + s.leads,
      signups: acc.signups + s.signups,
      preorders: acc.preorders + s.preorders,
      spendCents: acc.spendCents + s.spendCents,
    }),
    { visitors: 0, leads: 0, signups: 0, preorders: 0, spendCents: 0 },
  );

  return {
    ...totals,
    conversionRate: totals.visitors > 0 ? (totals.leads / totals.visitors) * 100 : 0,
    costPerLeadCents: totals.leads > 0 ? totals.spendCents / totals.leads : null,
  };
}
