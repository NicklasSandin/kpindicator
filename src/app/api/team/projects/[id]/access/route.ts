import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { canManageTeam, getCurrentOrganization } from "@/lib/organization";

const bodySchema = z.object({ restricted: z.boolean(), memberIds: z.array(z.string().min(1)).max(200) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentOrganization();
  if (!canManageTeam(context.role)) return NextResponse.json({ error: "You cannot change project access." }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project access settings." }, { status: 400 });

  const project = await prisma.project.findFirst({ where: { id, organizationId: context.organization.id } });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const uniqueMemberIds = [...new Set(parsed.data.memberIds)];
  const validMembers = await prisma.organizationMember.findMany({
    where: { id: { in: uniqueMemberIds }, organizationId: context.organization.id, role: { in: ["MEMBER", "VIEWER"] } },
    select: { id: true },
  });
  if (validMembers.length !== uniqueMemberIds.length) {
    return NextResponse.json({ error: "One or more selected members are invalid." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.project.update({ where: { id }, data: { restricted: parsed.data.restricted } }),
    prisma.projectAccess.deleteMany({ where: { projectId: id } }),
    ...(parsed.data.restricted && validMembers.length
      ? [prisma.projectAccess.createMany({ data: validMembers.map((member) => ({ projectId: id, memberId: member.id })) })]
      : []),
    prisma.organizationAuditLog.create({ data: {
      organizationId: context.organization.id, actorId: context.user.id, actorName: context.user.name,
      action: "PROJECT_ACCESS_CHANGED", target: project.name,
      metadata: { restricted: parsed.data.restricted, memberCount: validMembers.length },
    } }),
  ]);
  return NextResponse.json({ ok: true });
}
