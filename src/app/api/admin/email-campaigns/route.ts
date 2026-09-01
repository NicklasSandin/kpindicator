import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getApiAdmin } from "@/lib/api-auth";
import { parseRecipients } from "@/lib/email-recipients";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(300),
  previewText: z.string().max(300).optional(),
  fromName: z.string().max(200).optional(),
  fromEmail: z.string().email().optional().or(z.literal("")),
  audience: z.string().max(500).optional(),
  bodyText: z.string().min(1).max(30_000),
  templateKey: z.string().max(100).optional(),
  recipientsRaw: z.string().max(50_000),
});

export async function POST(req: NextRequest) {
  if (!(await getApiAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const { recipientsRaw, fromEmail, ...data } = parsed.data;
  const recipients = parseRecipients(recipientsRaw);

  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "Add at least one recipient (one per line, e.g. Name <email@example.com>)." },
      { status: 400 },
    );
  }

  const suppressions = await prisma.emailSuppression.findMany({
    where: { email: { in: recipients.map((recipient) => recipient.email) } },
    select: { email: true },
  });
  const suppressed = new Set(suppressions.map((item) => item.email));
  const sendable = recipients.filter((recipient) => !suppressed.has(recipient.email));

  if (sendable.length === 0) {
    return NextResponse.json({ error: "Every valid recipient is on the suppression list." }, { status: 400 });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      ...data,
      fromEmail: fromEmail || undefined,
      status: "DRAFT",
      recipients: { create: sendable.map((r) => ({ ...r, status: "PENDING" })) },
    },
  });

  return NextResponse.json({ id: campaign.id, suppressedCount: recipients.length - sendable.length });
}
