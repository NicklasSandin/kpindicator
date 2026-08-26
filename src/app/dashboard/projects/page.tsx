import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatDate } from "@/lib/format";
import { PACKAGES } from "@/content/packages";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: { ideas: true, reports: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every package you&apos;ve purchased, from intake through final report.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {projects.map((project) => {
          const pkg = PACKAGES.find((p) => p.dbType === project.package);
          return (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{pkg?.name ?? project.package}</Badge>
                    <StatusBadge status={project.status} />
                  </div>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </div>
              {project.summary && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {project.ideas.length} {project.ideas.length === 1 ? "idea" : "ideas"} &middot;{" "}
                  {project.reports.length} {project.reports.length === 1 ? "report" : "reports"}
                </span>
                <span>Started {formatDate(project.startDate ?? project.createdAt)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
