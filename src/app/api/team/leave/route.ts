import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization, ORGANIZATION_COOKIE } from "@/lib/organization";

export async function DELETE() {
  const context = await getCurrentOrganization();
  if (context.role === "OWNER") {
    return NextResponse.json({ error: "Transfer ownership before leaving this team." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.organizationAuditLog.create({ data: {
      organizationId: context.organization.id, actorId: context.user.id, actorName: context.user.name,
      action: "MEMBER_LEFT", target: context.user.email,
    } }),
    prisma.organizationMember.delete({ where: { id: context.membership.id } }),
  ]);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ORGANIZATION_COOKIE);
  return response;
}
