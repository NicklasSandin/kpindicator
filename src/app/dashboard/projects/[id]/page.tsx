import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sumMetrics } from "@/lib/metrics";
import { formatCents, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PACKAGES } from "@/content/packages";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      ideas: {
        orderBy: { priorityRank: "asc" },
        include: { campaigns: { include: { metrics: true } }, reports: true },
      },
      reports: { where: { ideaId: null } },
    },
  });

  if (!project) notFound();

  const pkg = PACKAGES.find((p) => p.dbType === project.package);
  const allSnapshots = project.ideas.flatMap((i) => i.campaigns.flatMap((c) => c.metrics));
  const totals = sumMetrics(allSnapshots);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All projects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{pkg?.name ?? project.package}</Badge>
            <StatusBadge status={project.status} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{project.name}</h1>
          {project.summary && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.summary}</p>
          )}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Started {formatDate(project.startDate ?? project.createdAt)}</p>
          {project.targetCompleteDate && (
            <p className="mt-0.5">Target {formatDate(project.targetCompleteDate)}</p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Visitors" value={formatNumber(totals.visitors)} />
        <MetricCard label="Leads" value={formatNumber(totals.leads)} />
        <MetricCard label="Conversion rate" value={formatPercent(totals.conversionRate)} />
        <MetricCard
          label="Media spend"
          value={formatCents(totals.spendCents)}
          detail={
            totals.costPerLeadCents ? `${formatCents(totals.costPerLeadCents)} / lead` : undefined
          }
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          Ideas <span className="text-muted-foreground">({project.ideas.length})</span>
        </h2>
        <div className="mt-4 space-y-4">
          {project.ideas.map((idea) => {
            const ideaSnapshots = idea.campaigns.flatMap((c) => c.metrics);
            const ideaTotals = sumMetrics(ideaSnapshots);
            const report = idea.reports[0];

            return (
              <div key={idea.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{idea.name}</h3>
                      <StatusBadge status={idea.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{idea.oneLiner}</p>
                  </div>
                  {idea.landingPageUrl && (
                    <a
                      href={idea.landingPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Landing page
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Visitors</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {formatNumber(ideaTotals.visitors)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Leads</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {formatNumber(ideaTotals.leads)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {formatPercent(ideaTotals.conversionRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Campaigns</p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {idea.campaigns.length}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {idea.campaigns.map((c) => (
                    <Badge key={c.id} variant="outline" className="capitalize">
                      {c.channel.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  ))}
                </div>

                {report && (
                  <Link
                    href={`/dashboard/reports/${report.id}`}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <FileText className="size-3.5" />
                    View {idea.name} report
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {project.reports.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Portfolio reports</h2>
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {project.reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{report.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </p>
                </div>
                <StatusBadge status={report.recommendation} className="shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
