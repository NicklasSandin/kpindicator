import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { EmailEventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Generic, provider-agnostic ingestion endpoint for outbound email engagement
 * events (opens, clicks, bounces, etc.). No ESP is wired up yet — once one
 * is chosen, add a thin adapter that translates its webhook payload into
 * this normalized shape and forwards it here (or inline the mapping in this
 * route). See docs/email-campaigns.md.
 *
 * Body shape:
 *   {
 *     type: "sent"|"delivered"|"opened"|"clicked"|"bounced"|"complained"|"unsubscribed"|"failed",
 *     email: "recipient@example.com",
 *     campaignId?: string,      // our EmailCampaign id — improves matching when set
 *     recipientId?: string,     // our EmailRecipient id — exact match, use if you have it
 *     occurredAt?: string,      // ISO timestamp, defaults to now
 *     url?: string,             // for "clicked"
 *     reason?: string,          // for "bounced" / "failed"
 *   }
 *
 * Optionally protected by EMAIL_WEBHOOK_SECRET — if set, requests must send
 * a matching `x-webhook-secret` header. Unset means unauthenticated (fine
 * for local testing, not for a real deployment).
 */

const bodySchema = z.object({
  type: z.enum(["sent", "delivered", "opened", "clicked", "bounced", "complained", "unsubscribed", "failed"]),
  email: z.string().email(),
  campaignId: z.string().optional(),
  recipientId: z.string().optional(),
  occurredAt: z.string().datetime().optional(),
  url: z.string().max(2000).optional(),
  reason: z.string().max(500).optional(),
});

const EVENT_TO_STATUS: Record<string, EmailEventType> = {
  sent: "SENT",
  delivered: "DELIVERED",
  opened: "OPENED",
  clicked: "CLICKED",
  bounced: "BOUNCED",
  complained: "COMPLAINED",
  unsubscribed: "UNSUBSCRIBED",
  failed: "FAILED",
};

/** Lower = more engaged. Prevents an out-of-order webhook (e.g. a delayed
 * "delivered" arriving after "opened") from downgrading recorded status. */
const ENGAGEMENT_RANK: Record<string, number> = {
  CLICKED: 0,
  OPENED: 1,
  DELIVERED: 2,
  SENT: 3,
  PENDING: 4,
  BOUNCED: 5,
  COMPLAINED: 5,
  UNSUBSCRIBED: 5,
  FAILED: 5,
};

export async function POST(req: NextRequest) {
  const requiredSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (requiredSecret && req.headers.get("x-webhook-secret") !== requiredSecret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const { type, email, campaignId, recipientId, occurredAt, url, reason } = parsed.data;
  const eventTime = occurredAt ? new Date(occurredAt) : new Date();
  const newStatus = EVENT_TO_STATUS[type];

  const recipient = recipientId
    ? await prisma.emailRecipient.findUnique({ where: { id: recipientId } })
    : campaignId
      ? await prisma.emailRecipient.findUnique({ where: { campaignId_email: { campaignId, email } } })
      : await prisma.emailRecipient.findFirst({ where: { email }, orderBy: { createdAt: "desc" } });

  if (!recipient) {
    return NextResponse.json({ error: "No matching recipient found." }, { status: 404 });
  }

  await prisma.emailEvent.create({
    data: { recipientId: recipient.id, type: newStatus, occurredAt: eventTime, url },
  });

  const shouldAdvanceStatus =
    (ENGAGEMENT_RANK[newStatus] ?? 9) <= (ENGAGEMENT_RANK[recipient.status] ?? 9);

  await prisma.emailRecipient.update({
    where: { id: recipient.id },
    data: {
      status: shouldAdvanceStatus ? newStatus : undefined,
      sentAt: type === "sent" ? (recipient.sentAt ?? eventTime) : undefined,
      deliveredAt: type === "delivered" ? (recipient.deliveredAt ?? eventTime) : undefined,
      firstOpenedAt: type === "opened" ? (recipient.firstOpenedAt ?? eventTime) : undefined,
      lastOpenedAt: type === "opened" ? eventTime : undefined,
      openCount: type === "opened" ? { increment: 1 } : undefined,
      firstClickedAt: type === "clicked" ? (recipient.firstClickedAt ?? eventTime) : undefined,
      lastClickedAt: type === "clicked" ? eventTime : undefined,
      clickCount: type === "clicked" ? { increment: 1 } : undefined,
      bouncedAt: type === "bounced" ? eventTime : undefined,
      bounceReason: type === "bounced" ? reason : undefined,
      unsubscribedAt: type === "unsubscribed" ? eventTime : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
