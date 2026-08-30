import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { getCurrentOrganization, visibleProjectWhere } from "@/lib/organization";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const context = await getCurrentOrganization();

  const reports = await prisma.report.findMany({
    where: { project: visibleProjectWhere(context) },
    include: { project: true, idea: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every written go / no-go call we&apos;ve delivered, across all projects.
      </p>

      <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
        {reports.map((report) => (
          <Link
            key={report.id}
            href={`/dashboard/reports/${report.id}`}
            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{report.title}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {report.project.name}
                {report.idea ? ` · ${report.idea.name}` : ""} · {formatDate(report.createdAt)}
              </p>
            </div>
            <StatusBadge status={report.recommendation} className="shrink-0" />
          </Link>
        ))}
        {reports.length === 0 && (
          <p className="p-5 text-sm text-muted-foreground">No reports published yet.</p>
        )}
      </div>
    </div>
  );
}
