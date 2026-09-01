import { NextRequest, NextResponse } from "next/server";

import { verifyUnsubscribeToken } from "@/lib/campaign-email";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = String((await req.json().catch(() => null))?.token || "");
  const recipientId = verifyUnsubscribeToken(token);
  if (!recipientId) return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 });
  const recipient = await prisma.emailRecipient.findUnique({ where: { id: recipientId } });
  if (!recipient) return NextResponse.json({ error: "This recipient no longer exists." }, { status: 404 });
  const occurredAt = new Date();
  await prisma.$transaction([
    prisma.emailSuppression.upsert({ where: { email: recipient.email }, update: { reason: "UNSUBSCRIBED", source: recipient.id }, create: { email: recipient.email, reason: "UNSUBSCRIBED", source: recipient.id } }),
    prisma.emailRecipient.updateMany({ where: { email: recipient.email }, data: { status: "UNSUBSCRIBED", unsubscribedAt: occurredAt } }),
    prisma.emailEvent.create({ data: { recipientId: recipient.id, type: "UNSUBSCRIBED", occurredAt } }),
  ]);
  return NextResponse.json({ ok: true });
}
