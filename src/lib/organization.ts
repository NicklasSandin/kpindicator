import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

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
      },
    });
    return { user, organization, role: "OWNER" as const, memberships: [] };
  }

  return {
    user,
    organization: membership.organization,
    role: membership.role,
    memberships,
  };
}

export function canManageTeam(role: string) {
  return role === "OWNER" || role === "ADMIN";
}
