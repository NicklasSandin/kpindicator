import type { EmailRecipient } from "@prisma/client";

export interface EmailCampaignTotals {
  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
}

/** A recipient counts as "opened" once status has progressed past SENT/DELIVERED. */
const OPENED_STATUSES = new Set(["OPENED", "CLICKED"]);
const SENT_STATUSES = new Set(["SENT", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "COMPLAINED", "UNSUBSCRIBED"]);
const DELIVERED_STATUSES = new Set(["DELIVERED", "OPENED", "CLICKED"]);

export function sumEmailRecipients(recipients: EmailRecipient[]): EmailCampaignTotals {
  const recipientCount = recipients.length;
  const sent = recipients.filter((r) => SENT_STATUSES.has(r.status)).length;
  const delivered = recipients.filter((r) => DELIVERED_STATUSES.has(r.status)).length;
  const opened = recipients.filter((r) => OPENED_STATUSES.has(r.status) || r.openCount > 0).length;
  const clicked = recipients.filter((r) => r.status === "CLICKED" || r.clickCount > 0).length;
  const bounced = recipients.filter((r) => r.status === "BOUNCED").length;
  const unsubscribed = recipients.filter((r) => r.status === "UNSUBSCRIBED").length;

  return {
    recipients: recipientCount,
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    unsubscribed,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    clickToOpenRate: opened > 0 ? (clicked / opened) * 100 : 0,
    bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
  };
}
