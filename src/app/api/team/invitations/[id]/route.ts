import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { canManageTeam, getCurrentOrganization, logTeamAction } from "@/lib/organization";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getCurrentOrganization();
  if (!canManageTeam(context.role)) return NextResponse.json({ error: "You cannot revoke invitations." }, { status: 403 });

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id, organizationId: context.organization.id, acceptedAt: null },
  });
  if (!invitation) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  await prisma.organizationInvitation.delete({ where: { id } });
  await logTeamAction({
    organizationId: context.organization.id, actorId: context.user.id, actorName: context.user.name,
    action: "INVITATION_REVOKED", target: invitation.email,
  });
  return NextResponse.json({ ok: true });
}
