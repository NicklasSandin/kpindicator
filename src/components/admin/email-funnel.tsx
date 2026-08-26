import { formatNumber, formatPercent } from "@/lib/format";

interface Stage {
  label: string;
  value: number;
  rate?: number;
}

export function EmailFunnel({ sent, delivered, opened, clicked }: { sent: number; delivered: number; opened: number; clicked: number }) {
  const stages: Stage[] = [
    { label: "Sent", value: sent },
    { label: "Delivered", value: delivered, rate: sent > 0 ? (delivered / sent) * 100 : 0 },
    { label: "Opened", value: opened, rate: delivered > 0 ? (opened / delivered) * 100 : 0 },
    { label: "Clicked", value: clicked, rate: delivered > 0 ? (clicked / delivered) * 100 : 0 },
  ];
  const max = Math.max(sent, 1);

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-foreground">{stage.label}</span>
            <span className="text-muted-foreground">
              {formatNumber(stage.value)}
              {stage.rate !== undefined && (
                <span className="ml-1.5 text-xs">({formatPercent(stage.rate)} of delivered)</span>
              )}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max((stage.value / max) * 100, stage.value > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
