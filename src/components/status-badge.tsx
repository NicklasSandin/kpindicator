import { cn } from "@/lib/utils";

type Tone = "go" | "nogo" | "testing" | "pending";

const TONE_CLASSES: Record<Tone, string> = {
  go: "bg-status-go text-status-go-foreground",
  nogo: "bg-status-nogo text-status-nogo-foreground",
  testing: "bg-status-testing text-status-testing-foreground",
  pending: "bg-status-pending text-status-pending-foreground",
};

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  // ProjectStatus
  INTAKE: { label: "Intake", tone: "pending" },
  POSITIONING: { label: "Positioning", tone: "pending" },
  BUILD: { label: "Building", tone: "testing" },
  TESTING: { label: "Testing", tone: "testing" },
  REPORTING: { label: "Reporting", tone: "testing" },
  COMPLETE: { label: "Complete", tone: "go" },
  ON_HOLD: { label: "On hold", tone: "pending" },
  // IdeaStatus
  QUEUED: { label: "Queued", tone: "pending" },
  VALIDATED: { label: "Validated", tone: "go" },
  INVALIDATED: { label: "Invalidated", tone: "nogo" },
  INCONCLUSIVE: { label: "Inconclusive", tone: "testing" },
  // CampaignStatus
  DRAFT: { label: "Draft", tone: "pending" },
  LIVE: { label: "Live", tone: "testing" },
  PAUSED: { label: "Paused", tone: "pending" },
  // Recommendation
  GO: { label: "Go", tone: "go" },
  NO_GO: { label: "No-go", tone: "nogo" },
  PIVOT: { label: "Pivot", tone: "testing" },
  MORE_DATA_NEEDED: { label: "More data needed", tone: "testing" },
  // OrderStatus
  PENDING: { label: "Pending", tone: "pending" },
  PAID: { label: "Paid", tone: "go" },
  REFUNDED: { label: "Refunded", tone: "pending" },
  CANCELED: { label: "Canceled", tone: "nogo" },
  // EmailCampaignStatus (DRAFT, PAUSED shared with CampaignStatus above)
  SCHEDULED: { label: "Scheduled", tone: "pending" },
  SENDING: { label: "Sending", tone: "testing" },
  SENT: { label: "Sent", tone: "testing" },
  // EmailRecipientStatus (PENDING shared with OrderStatus above) —
  // reserve "go" specifically for actual engagement (opened/clicked),
  // not just successful delivery, so it reads as a demand signal.
  DELIVERED: { label: "Delivered", tone: "pending" },
  OPENED: { label: "Opened", tone: "go" },
  CLICKED: { label: "Clicked", tone: "go" },
  BOUNCED: { label: "Bounced", tone: "nogo" },
  COMPLAINED: { label: "Complained", tone: "nogo" },
  UNSUBSCRIBED: { label: "Unsubscribed", tone: "nogo" },
  FAILED: { label: "Failed", tone: "nogo" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, tone: "pending" as Tone };
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[entry.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {entry.label}
    </span>
  );
}
