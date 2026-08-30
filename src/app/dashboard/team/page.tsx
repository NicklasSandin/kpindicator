import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization, canManageTeam } from "@/lib/organization";
import { TeamManager } from "@/components/dashboard/team-manager";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const context = await getCurrentOrganization();
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: context.organization.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-foreground">{context.organization.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage who can access this team’s projects and reports.</p>
      <div className="mt-8">
        <TeamManager
          members={members}
          teams={context.memberships.map((membership) => membership.organization)}
          currentTeamId={context.organization.id}
          currentUserId={context.user.id}
          canManage={canManageTeam(context.role)}
        />
      </div>
    </div>
  );
}
