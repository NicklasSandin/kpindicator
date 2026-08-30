import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization, canManageTeam } from "@/lib/organization";

const bodySchema = z.object({ role: z.enum(["ADMIN", "MEMBER", "VIEWER"]) });

async function manageableMember(id: string) {
  const context = await getCurrentOrganization();
  if (!canManageTeam(context.role)) return { context, member: null, forbidden: true };
  const member = await prisma.organizationMember.findFirst({
    where: { id, organizationId: context.organization.id },
    include: { user: { select: { email: true } } },
  });
  return { context, member, forbidden: false };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { context, member, forbidden } = await manageableMember(id);
  if (forbidden) return NextResponse.json({ error: "You cannot manage this team." }, { status: 403 });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  if (member.userId === context.user.id) return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  if (member.role === "OWNER") return NextResponse.json({ error: "The owner role cannot be changed." }, { status: 400 });
  if (context.role === "ADMIN" && member.role === "ADMIN") {
    return NextResponse.json({ error: "Only an owner can change another admin." }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  await prisma.$transaction([
    prisma.organizationMember.update({ where: { id }, data: { role: parsed.data.role } }),
    prisma.organizationAuditLog.create({ data: {
      organizationId: context.organization.id, actorId: context.user.id, actorName: context.user.name,
      action: "MEMBER_ROLE_CHANGED", target: member.user.email,
      metadata: { previousRole: member.role, newRole: parsed.data.role },
    } }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { context, member, forbidden } = await manageableMember(id);
  if (forbidden) return NextResponse.json({ error: "You cannot manage this team." }, { status: 403 });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  if (member.userId === context.user.id) return NextResponse.json({ error: "Use Leave team to remove yourself." }, { status: 400 });
  if (member.role === "OWNER") return NextResponse.json({ error: "The team owner cannot be removed." }, { status: 400 });
  if (context.role === "ADMIN" && member.role === "ADMIN") {
    return NextResponse.json({ error: "Only an owner can remove another admin." }, { status: 403 });
  }
  await prisma.$transaction([
    prisma.organizationAuditLog.create({ data: {
      organizationId: context.organization.id, actorId: context.user.id, actorName: context.user.name,
      action: "MEMBER_REMOVED", target: member.user.email, metadata: { role: member.role },
    } }),
    prisma.organizationMember.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
