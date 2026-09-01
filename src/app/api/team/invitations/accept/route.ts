import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ORGANIZATION_COOKIE } from "@/lib/organization";

const bodySchema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!user.emailVerifiedAt) return NextResponse.json({ error: "Verify your email before joining a team." }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invitation." }, { status: 400 });

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { tokenHash: createHash("sha256").update(parsed.data.token).digest("hex") },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation is invalid or expired." }, { status: 400 });
  }
  if (invitation.email !== user.email.toLowerCase()) {
    return NextResponse.json({ error: `Log in as ${invitation.email} to accept this invitation.` }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
      update: { role: invitation.role },
      create: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role },
    }),
    prisma.organizationInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
    prisma.organizationAuditLog.create({ data: {
      organizationId: invitation.organizationId, actorId: user.id, actorName: user.name,
      action: "INVITATION_ACCEPTED", target: user.email, metadata: { role: invitation.role },
    } }),
  ]);

  const response = NextResponse.json({ ok: true, redirect: "/dashboard" });
  response.cookies.set(ORGANIZATION_COOKIE, invitation.organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
