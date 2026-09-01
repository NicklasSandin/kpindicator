import type { EmailEventType, EmailRecipientStatus } from "@prisma/client";

export const EVENT_TO_STATUS = {
  sent: "SENT",
  delivered: "DELIVERED",
  opened: "OPENED",
  clicked: "CLICKED",
  bounced: "BOUNCED",
  complained: "COMPLAINED",
  unsubscribed: "UNSUBSCRIBED",
  failed: "FAILED",
} as const satisfies Record<string, EmailEventType>;

const ENGAGEMENT_RANK: Record<EmailRecipientStatus, number> = {
  CLICKED: 0, OPENED: 1, DELIVERED: 2, SENT: 3, PENDING: 4,
  BOUNCED: 5, COMPLAINED: 5, UNSUBSCRIBED: 5, FAILED: 5,
};

const TERMINAL = new Set<EmailRecipientStatus>(["BOUNCED", "COMPLAINED", "UNSUBSCRIBED"]);

export function shouldAdvanceEmailStatus(current: EmailRecipientStatus, next: EmailRecipientStatus) {
  if (TERMINAL.has(current)) return false;
  if (TERMINAL.has(next)) return true;
  return ENGAGEMENT_RANK[next] <= ENGAGEMENT_RANK[current];
}
