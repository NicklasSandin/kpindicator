import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/organization";

const bodySchema = z.object({ memberId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const context = await getCurrentOrganization();
  if (context.role !== "OWNER") return NextResponse.json({ error: "Only the current owner can transfer ownership." }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a team member." }, { status: 400 });

  const target = await prisma.organizationMember.findFirst({
    where: { id: parsed.data.memberId, organizationId: context.organization.id, NOT: { userId: context.user.id } },
    include: { user: true },
  });
  if (!target) return NextResponse.json({ error: "That team member was not found." }, { status: 404 });

  await prisma.$transaction([
    prisma.organizationMember.update({ where: { id: context.membership.id }, data: { role: "ADMIN" } }),
    prisma.organizationMember.update({ where: { id: target.id }, data: { role: "OWNER" } }),
    prisma.organizationAuditLog.create({ data: {
      organizationId: context.organization.id, actorId: context.user.id, actorName: context.user.name,
      action: "OWNERSHIP_TRANSFERRED", target: target.user.email,
      metadata: { previousOwner: context.user.email, newOwner: target.user.email },
    } }),
  ]);
  return NextResponse.json({ ok: true });
}
