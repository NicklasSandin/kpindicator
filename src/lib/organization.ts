import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const ORGANIZATION_COOKIE = "kp_organization";

export async function getCurrentOrganization() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const requestedId = cookieStore.get(ORGANIZATION_COOKIE)?.value;

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  const membership =
    memberships.find((item) => item.organizationId === requestedId) ?? memberships[0];

  if (!membership) {
    // Handles accounts created between deployment and the organization migration.
    const organization = await prisma.organization.create({
      data: {
        name: user.company?.trim() || `${user.name}'s team`,
        members: { create: { userId: user.id, role: "OWNER" } },
        auditLogs: {
          create: {
            actorId: user.id,
            actorName: user.name,
            action: "TEAM_CREATED",
            target: user.company?.trim() || `${user.name}'s team`,
          },
        },
      },
    });
    const createdMembership = await prisma.organizationMember.findUniqueOrThrow({
      where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
      include: { organization: true },
    });
    return {
      user,
      organization,
      membership: createdMembership,
      role: "OWNER" as const,
      memberships: [createdMembership],
    };
  }

  return {
    user,
    organization: membership.organization,
    membership,
    role: membership.role,
    memberships,
  };
}

export function canManageTeam(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

export function visibleProjectWhere(context: Awaited<ReturnType<typeof getCurrentOrganization>>): Prisma.ProjectWhereInput {
  const base: Prisma.ProjectWhereInput = { organizationId: context.organization.id };
  if (canManageTeam(context.role)) return base;
  return {
    ...base,
    OR: [
      { restricted: false },
      { memberAccess: { some: { memberId: context.membership.id } } },
    ],
  };
}

export async function logTeamAction({
  organizationId,
  actorId,
  actorName,
  action,
  target,
  metadata,
}: {
  organizationId: string;
  actorId?: string | null;
  actorName: string;
  action: string;
  target?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.organizationAuditLog.create({
    data: { organizationId, actorId, actorName, action, target, metadata },
  });
}
