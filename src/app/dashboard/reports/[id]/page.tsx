import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sumMetrics } from "@/lib/metrics";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { PACKAGES } from "@/content/packages";
import { MDXContent } from "@/components/mdx-content";
import { RecommendationBanner } from "@/components/dashboard/recommendation-banner";
import { ReportPrintButton } from "@/components/dashboard/report-print-button";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await prisma.report.findUnique({ where: { id } });
  return { title: report?.title ?? "Report" };
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const report = await prisma.report.findFirst({
    where: { id, project: { userId: user.id } },
    include: {
      project: true,
      idea: { include: { campaigns: { include: { metrics: true } } } },
    },
  });

  if (!report) notFound();

  const pkg = PACKAGES.find((p) => p.dbType === report.project.package);
  const ideaTotals = report.idea
    ? sumMetrics(report.idea.campaigns.flatMap((c) => c.metrics))
    : null;

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All reports
        </Link>
        <ReportPrintButton />
      </div>

      {/* Report letterhead */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">WhatHits</span>
          <span>&middot;</span>
          <span>Validation Report</span>
          <span>&middot;</span>
          <span>{formatDate(report.publishedAt ?? report.createdAt)}</span>
        </div>

        <h1 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {report.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{report.project.name}</Badge>
          {pkg && <Badge variant="outline">{pkg.name}</Badge>}
        </div>

        <p className="mt-4 text-[15px] text-muted-foreground">{report.summary}</p>

        <div className="mt-6">
          <RecommendationBanner recommendation={report.recommendation} />
        </div>

        {ideaTotals && (
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
            <div>
              <dd className="text-lg font-semibold text-foreground">
                {formatNumber(ideaTotals.visitors)}
              </dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">Visitors</dt>
            </div>
            <div>
              <dd className="text-lg font-semibold text-foreground">
                {formatNumber(ideaTotals.leads)}
              </dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">Leads</dt>
            </div>
            <div>
              <dd className="text-lg font-semibold text-foreground">
                {formatPercent(ideaTotals.conversionRate)}
              </dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">Conversion</dt>
            </div>
            <div>
              <dd className="text-lg font-semibold text-foreground">
                {formatNumber(ideaTotals.preorders)}
              </dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">Preorders / deposits</dt>
            </div>
          </dl>
        )}
      </div>

      <div className="mt-8">
        <MDXContent source={report.body} />
      </div>

      <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
        <p>
          Prepared by WhatHits for {report.project.name}. Recommendations reflect the data
          available as of {formatDate(report.publishedAt ?? report.createdAt)} against
          thresholds agreed before testing began.
        </p>
      </div>
    </div>
  );
}
