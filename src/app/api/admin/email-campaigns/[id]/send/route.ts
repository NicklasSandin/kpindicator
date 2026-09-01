import { NextRequest, NextResponse } from "next/server";

import { getApiAdmin } from "@/lib/api-auth";
import { campaignEmailConfigured, createUnsubscribeToken, sendCampaignEmail } from "@/lib/campaign-email";
import { renderEmailTemplate } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

const MAX_BATCH = 50;

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await getApiAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!campaignEmailConfigured()) {
    return NextResponse.json({ error: "Configure SES_FROM_EMAIL, SES credentials, and EMAIL_PHYSICAL_ADDRESS before sending." }, { status: 503 });
  }

  const { id } = await context.params;
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: { recipients: { where: { status: { in: ["PENDING", "FAILED"] } }, take: MAX_BATCH } },
  });
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  if (!campaign.bodyText.trim()) return NextResponse.json({ error: "Campaign message is empty." }, { status: 400 });

  await prisma.emailCampaign.update({ where: { id }, data: { status: "SENDING" } });
  let sent = 0;
  let failed = 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  for (const recipient of campaign.recipients) {
    const suppression = await prisma.emailSuppression.findUnique({ where: { email: recipient.email } });
    if (suppression) continue;

    const values = {
      firstName: recipient.name?.split(/\s+/)[0] || "there",
      company: recipient.company || "your team",
      idea: "the idea",
      senderName: campaign.fromName || "KPIndicator",
    };
    const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(recipient.id))}`;
    const body = `${renderEmailTemplate(campaign.bodyText, values)}\n\n—\n${process.env.EMAIL_PHYSICAL_ADDRESS}\nUnsubscribe: ${unsubscribeUrl}`;
    const result = await sendCampaignEmail({
      to: recipient.email,
      subject: renderEmailTemplate(campaign.subject, values),
      text: body,
      fromEmail: campaign.fromEmail,
    });
    const occurredAt = new Date();
    if (result.ok) {
      sent += 1;
      await prisma.emailRecipient.update({ where: { id: recipient.id }, data: { status: "SENT", sentAt: occurredAt, externalId: result.externalId } });
      await prisma.emailEvent.create({ data: { recipientId: recipient.id, type: "SENT", occurredAt } });
    } else {
      failed += 1;
      await prisma.emailRecipient.update({ where: { id: recipient.id }, data: { status: "FAILED" } });
      await prisma.emailEvent.create({ data: { recipientId: recipient.id, type: "FAILED", occurredAt, meta: result.error } });
    }
  }

  const remaining = await prisma.emailRecipient.count({ where: { campaignId: id, status: "PENDING" } });
  await prisma.emailCampaign.update({
    where: { id },
    data: {
      status: remaining > 0 ? "PAUSED" : sent === 0 && failed > 0 ? "FAILED" : "SENT",
      sentAt: sent > 0 ? (campaign.sentAt ?? new Date()) : campaign.sentAt,
    },
  });
  return NextResponse.json({ ok: true, sent, failed, remaining });
}
