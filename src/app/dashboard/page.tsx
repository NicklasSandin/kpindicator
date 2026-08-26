import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, FileText, FolderKanban, Lightbulb, Target } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sumMetrics } from "@/lib/metrics";
import { formatDate, formatNumber } from "@/lib/format";
import { PACKAGES } from "@/content/packages";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: {
      ideas: { include: { campaigns: { include: { metrics: true } } } },
      reports: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const allSnapshots = projects.flatMap((p) =>
    p.ideas.flatMap((i) => i.campaigns.flatMap((c) => c.metrics)),
  );
  const totals = sumMetrics(allSnapshots);

  const validatedIdeas = projects.flatMap((p) => p.ideas).filter((i) => i.status === "VALIDATED").length;
  const activeProjects = projects.filter((p) => !["COMPLETE", "ON_HOLD"].includes(p.status)).length;
  const totalReports = projects.reduce((acc, p) => acc + p.reports.length, 0);

  const recentReports = projects
    .flatMap((p) => p.reports.map((r) => ({ ...r, projectName: p.name })))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s where things stand across {user.company ?? "your"} ideas in testing.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Active projects" value={String(activeProjects)} icon={FolderKanban} />
        <MetricCard label="Ideas validated" value={String(validatedIdeas)} icon={Lightbulb} />
        <MetricCard
          label="Total leads"
          value={formatNumber(totals.leads)}
          detail={`from ${formatNumber(totals.visitors)} visitors`}
          icon={Target}
        />
        <MetricCard label="Reports published" value={String(totalReports)} icon={FileText} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {project.summary}
                  </p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  {project.ideas.length} {project.ideas.length === 1 ? "idea" : "ideas"} &middot;
                  {" "}
                  {project.reports.length} {project.reports.length === 1 ? "report" : "reports"}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent reports</h2>
          <Link
            href="/dashboard/reports"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {recentReports.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/reports/${report.id}`}
              className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{report.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {report.projectName} &middot; {formatDate(report.createdAt)}
                </p>
              </div>
              <StatusBadge status={report.recommendation} className="shrink-0" />
            </Link>
          ))}
          {recentReports.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No reports published yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
