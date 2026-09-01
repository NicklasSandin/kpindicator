import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { canManageTeam, getCurrentOrganization, logTeamAction } from "@/lib/organization";
import { sendEmail } from "@/lib/notify";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentOrganization();
  if (!canManageTeam(context.role)) return NextResponse.json({ error: "You cannot resend invitations." }, { status: 403 });

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id, organizationId: context.organization.id, acceptedAt: null },
  });
  if (!invitation) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.organizationInvitation.update({
    where: { id },
    data: { tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt },
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const inviteUrl = `${siteUrl}/invite/${token}`;
  const delivered = await sendEmail(
    invitation.email,
    `Reminder: join ${context.organization.name} on KPIndicator`,
    `${context.user.name} invited you to join ${context.organization.name} on KPIndicator.\n\nAccept the invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
  );
  await logTeamAction({
    organizationId: context.organization.id, actorId: context.user.id, actorName: context.user.name,
    action: "INVITATION_RESENT", target: invitation.email, metadata: { delivered },
  });
  return NextResponse.json({ ok: true, inviteUrl, delivered });
}
