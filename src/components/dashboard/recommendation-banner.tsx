import { CheckCircle2, XCircle, RefreshCw, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIG = {
  GO: {
    label: "Go",
    message: "This cleared the agreed threshold. Recommended to proceed.",
    icon: CheckCircle2,
    className: "bg-status-go text-status-go-foreground",
  },
  NO_GO: {
    label: "No-go",
    message: "This did not clear the agreed threshold. Recommended to stop or re-scope.",
    icon: XCircle,
    className: "bg-status-nogo text-status-nogo-foreground",
  },
  PIVOT: {
    label: "Pivot",
    message: "The core idea has signal, but the current framing doesn't. Recommended to re-angle and re-test.",
    icon: RefreshCw,
    className: "bg-status-testing text-status-testing-foreground",
  },
  MORE_DATA_NEEDED: {
    label: "More data needed",
    message: "Result landed in a genuine gray zone. Recommended: a short, isolated follow-up test.",
    icon: HelpCircle,
    className: "bg-status-testing text-status-testing-foreground",
  },
} as const;

export function RecommendationBanner({ recommendation }: { recommendation: string }) {
  const config = CONFIG[recommendation as keyof typeof CONFIG];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl p-5", config.className)}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">Recommendation: {config.label}</p>
        <p className="mt-0.5 text-sm opacity-90">{config.message}</p>
      </div>
    </div>
  );
}
