import { prisma } from "@/lib/prisma";
import { EVENT_TO_STATUS, shouldAdvanceEmailStatus } from "@/lib/email-events";

export type NormalizedEmailEvent = {
  type: keyof typeof EVENT_TO_STATUS;
  email: string;
  campaignId?: string;
  recipientId?: string;
  /** The provider's message id — EmailRecipient.externalId, set at send time. */
  externalId?: string;
  occurredAt?: Date;
  url?: string;
  reason?: string;
};

export type IngestResult = { ok: true; recipientId: string } | { ok: false; error: "no_recipient" };

/**
 * Record one engagement event against a recipient.
 *
 * Shared by the generic webhook and the SES/SNS adapter so both write history,
 * advance status and suppress addresses identically — a bounce arriving from
 * SES has to poison the address exactly as one posted by hand would, or the
 * suppression list is only as good as whichever route happened to receive it.
 */
export async function recordEmailEvent(event: NormalizedEmailEvent): Promise<IngestResult> {
  const { type, email, campaignId, recipientId, externalId, url, reason } = event;
  const eventTime = event.occurredAt ?? new Date();
  const newStatus = EVENT_TO_STATUS[type];
  const address = email.toLowerCase();

  const recipient = recipientId
    ? await prisma.emailRecipient.findUnique({ where: { id: recipientId } })
    : externalId
    ? // The provider's own id is exact. Falling back to email would attribute a
      // bounce to whichever campaign happened to be most recent, which is wrong
      // as soon as the same address appears in two campaigns.
      ((await prisma.emailRecipient.findFirst({ where: { externalId }, orderBy: { createdAt: "desc" } })) ??
        (await prisma.emailRecipient.findFirst({ where: { email: address }, orderBy: { createdAt: "desc" } })))
    : campaignId
      ? await prisma.emailRecipient.findUnique({ where: { campaignId_email: { campaignId, email: address } } })
      : await prisma.emailRecipient.findFirst({ where: { email: address }, orderBy: { createdAt: "desc" } });

  if (!recipient) {
    // A bounce for an address we never sent to still has to suppress it —
    // otherwise a list imported twice re-sends to a known-bad address and the
    // bounce rate climbs on mail we already knew would fail.
    if (type === "bounced" || type === "complained" || type === "unsubscribed") {
      await suppress(address, type, null);
    }

    return { ok: false, error: "no_recipient" };
  }

  await prisma.emailEvent.create({
    data: { recipientId: recipient.id, type: newStatus, occurredAt: eventTime, url },
  });

  const advance = shouldAdvanceEmailStatus(recipient.status, newStatus);

  await prisma.emailRecipient.update({
    where: { id: recipient.id },
    data: {
      status: advance ? newStatus : undefined,
      deliveredAt: type === "delivered" ? eventTime : undefined,
      openCount: type === "opened" ? { increment: 1 } : undefined,
      firstOpenedAt: type === "opened" ? (recipient.firstOpenedAt ?? eventTime) : undefined,
      lastOpenedAt: type === "opened" ? eventTime : undefined,
      clickCount: type === "clicked" ? { increment: 1 } : undefined,
      firstClickedAt: type === "clicked" ? (recipient.firstClickedAt ?? eventTime) : undefined,
      lastClickedAt: type === "clicked" ? eventTime : undefined,
      bouncedAt: type === "bounced" ? eventTime : undefined,
      bounceReason: type === "bounced" ? reason : undefined,
      unsubscribedAt: type === "unsubscribed" ? eventTime : undefined,
    },
  });

  if (type === "bounced" || type === "complained" || type === "unsubscribed") {
    await suppress(address, type, recipient.id);
  }

  return { ok: true, recipientId: recipient.id };
}

async function suppress(email: string, reason: string, source: string | null) {
  await prisma.emailSuppression.upsert({
    where: { email },
    update: { reason: reason.toUpperCase(), source: source ?? undefined },
    create: { email, reason: reason.toUpperCase(), source: source ?? undefined },
  });
}
