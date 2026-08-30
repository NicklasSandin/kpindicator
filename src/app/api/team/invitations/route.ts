import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization, canManageTeam } from "@/lib/organization";
import { sendEmail } from "@/lib/notify";

const bodySchema = z.object({
  email: z.string().email().max(200),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export async function POST(req: NextRequest) {
  const { user, organization, role: currentRole } = await getCurrentOrganization();
  if (!canManageTeam(currentRole)) {
    return NextResponse.json({ error: "Only team owners and admins can invite people." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and role." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: organization.id, userId: existingUser.id } },
    });
    if (existingMember) {
      return NextResponse.json({ error: "That person is already on this team." }, { status: 409 });
    }
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.organizationInvitation.deleteMany({
    where: { organizationId: organization.id, email, acceptedAt: null },
  });
  await prisma.organizationInvitation.create({
    data: {
      organizationId: organization.id,
      email,
      role: parsed.data.role,
      tokenHash,
      invitedById: user.id,
      expiresAt,
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const inviteUrl = `${siteUrl}/invite/${token}`;
  const delivered = await sendEmail(
    email,
    `Join ${organization.name} on KPIndicator`,
    `${user.name} invited you to join ${organization.name} on KPIndicator.\n\nAccept the invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
  );

  return NextResponse.json({ ok: true, inviteUrl, delivered });
}
