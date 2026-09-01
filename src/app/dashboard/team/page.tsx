import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization, canManageTeam } from "@/lib/organization";
import { TeamManager } from "@/components/dashboard/team-manager";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const context = await getCurrentOrganization();
  const [members, invitations, projects, auditLogs] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: context.organization.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    canManageTeam(context.role)
      ? prisma.organizationInvitation.findMany({
          where: { organizationId: context.organization.id, acceptedAt: null },
          select: { id: true, email: true, role: true, expiresAt: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    canManageTeam(context.role)
      ? prisma.project.findMany({
          where: { organizationId: context.organization.id },
          select: { id: true, name: true, restricted: true, memberAccess: { select: { memberId: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.organizationAuditLog.findMany({
      where: { organizationId: context.organization.id },
      select: { id: true, actorName: true, action: true, target: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-foreground">{context.organization.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage who can access this team’s projects and reports.</p>
      <div className="mt-8">
        <TeamManager
          members={members}
          invitations={invitations.map((item) => ({ ...item, expiresAt: item.expiresAt.toISOString() }))}
          teams={context.memberships.map((membership) => membership.organization)}
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            restricted: project.restricted,
            memberIds: project.memberAccess.map((access) => access.memberId),
          }))}
          auditLogs={auditLogs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() }))}
          currentTeamId={context.organization.id}
          currentUserId={context.user.id}
          currentRole={context.role}
        />
      </div>
    </div>
  );
}
