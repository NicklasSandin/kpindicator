import { CheckCircle2, TrendingUp, Users, DollarSign } from "lucide-react";

const CHANNELS = [
  { label: "Paid social", value: 61 },
  { label: "Email outreach", value: 24 },
  { label: "Organic / direct", value: 15 },
];

export function ReportPreview() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/40">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs text-muted-foreground">Validation Sprint · Day 14 of 21</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">Idea: &ldquo;Ledger&rdquo;</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-status-testing px-2.5 py-1 text-[11px] font-medium text-status-testing-foreground">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-current" />
          </span>
          Live
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start gap-3 rounded-xl bg-status-go p-4 text-status-go-foreground">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Recommendation: Go</p>
            <p className="mt-0.5 text-xs opacity-90">Cleared the agreed threshold. Recommended to proceed.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3">
            <TrendingUp className="size-3.5 text-muted-foreground" />
            <p className="mt-2 text-lg font-semibold text-foreground">9.8%</p>
            <p className="text-[11px] text-muted-foreground">Visitor → lead</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <Users className="size-3.5 text-muted-foreground" />
            <p className="mt-2 text-lg font-semibold text-foreground">34</p>
            <p className="text-[11px] text-muted-foreground">Qualified leads</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <DollarSign className="size-3.5 text-muted-foreground" />
            <p className="mt-2 text-lg font-semibold text-foreground">$68</p>
            <p className="text-[11px] text-muted-foreground">Cost / lead</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Demand by channel
          </p>
          <div className="mt-2.5 space-y-2">
            {CHANNELS.map((c) => (
              <div key={c.label} className="flex items-center gap-2.5">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{c.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${c.value}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-foreground">
                  {c.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
