import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { canManageTeam, getCurrentOrganization, logTeamAction } from "@/lib/organization";

const bodySchema = z.object({ name: z.string().trim().min(2).max(100) });

export async function PATCH(req: NextRequest) {
  const context = await getCurrentOrganization();
  if (!canManageTeam(context.role)) {
    return NextResponse.json({ error: "Only owners and admins can rename the team." }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a team name between 2 and 100 characters." }, { status: 400 });

  const previousName = context.organization.name;
  await prisma.organization.update({ where: { id: context.organization.id }, data: { name: parsed.data.name } });
  await logTeamAction({
    organizationId: context.organization.id,
    actorId: context.user.id,
    actorName: context.user.name,
    action: "TEAM_RENAMED",
    target: parsed.data.name,
    metadata: { previousName },
  });
  return NextResponse.json({ ok: true });
}
