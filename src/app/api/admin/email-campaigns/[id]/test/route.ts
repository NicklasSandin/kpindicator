import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getApiAdmin } from "@/lib/api-auth";
import { campaignEmailConfigured, sendCampaignEmail } from "@/lib/campaign-email";
import { renderEmailTemplate } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getApiAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!campaignEmailConfigured()) return NextResponse.json({ error: "SES campaign sending is not configured." }, { status: 503 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid test address." }, { status: 400 });
  const { id } = await context.params;
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  const values = { firstName: admin.name.split(/\s+/)[0], company: "Example Company", idea: "the example idea", senderName: campaign.fromName || "KPIndicator" };
  const result = await sendCampaignEmail({
    to: parsed.data.email,
    subject: `[TEST] ${renderEmailTemplate(campaign.subject, values)}`,
    text: `${renderEmailTemplate(campaign.bodyText, values)}\n\n[Campaign test—no recipient state was changed.]`,
    fromEmail: campaign.fromEmail,
  });
  return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: result.error }, { status: 502 });
}
