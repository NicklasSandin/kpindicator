import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { notifyAdmin } from "@/lib/notify";
import { sendVerificationEmail } from "@/lib/email-verification";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  invitationToken: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(`signup:${requestIp(req.headers)}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many signup attempts. Please wait and try again." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form — name, a valid email, and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const { name, email, password, invitationToken } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try logging in instead." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const invitation = invitationToken
    ? await prisma.organizationInvitation.findUnique({
        where: { tokenHash: createHash("sha256").update(invitationToken).digest("hex") },
      })
    : null;

  if (
    invitationToken &&
    (!invitation ||
      invitation.acceptedAt ||
      invitation.expiresAt < new Date() ||
      invitation.email !== normalizedEmail)
  ) {
    return NextResponse.json(
      { error: "That invitation is invalid, expired, or belongs to another email." },
      { status: 400 },
    );
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email: normalizedEmail, passwordHash, role: "CLIENT" },
    });

    if (invitation) {
      await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: created.id,
          role: invitation.role,
        },
      });
      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      await tx.organizationAuditLog.create({
        data: {
          organizationId: invitation.organizationId,
          actorId: created.id,
          actorName: created.name,
          action: "INVITATION_ACCEPTED",
          target: created.email,
          metadata: { role: invitation.role },
        },
      });
    } else {
      await tx.organization.create({
        data: {
          name: `${name.trim()}'s team`,
          members: { create: { userId: created.id, role: "OWNER" } },
          auditLogs: {
            create: { actorId: created.id, actorName: created.name, action: "TEAM_CREATED", target: `${name.trim()}'s team` },
          },
        },
      });
    }

    return created;
  });

  await createSession(user.id);
  await sendVerificationEmail(user);
  await notifyAdmin("New KPIndicator signup", `${name} <${normalizedEmail}> just created an account.`);

  return NextResponse.json({ ok: true, redirect: "/verify-email" });
}
