import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MousePointerClick, Send, Users } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { sumEmailRecipients } from "@/lib/email-metrics";
import { formatNumber, formatPercent } from "@/lib/format";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: { absolute: "Overview — WhatHits Admin" } };

export default async function AdminOverviewPage() {
  const campaigns = await prisma.emailCampaign.findMany({
    include: { recipients: true },
    orderBy: { createdAt: "desc" },
  });

  const allRecipients = campaigns.flatMap((c) => c.recipients);
  const totals = sumEmailRecipients(allRecipients);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Marketing overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How WhatHits&apos; own outbound email campaigns are performing — opens, clicks, and
            everything in between.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/campaigns/new">New campaign</Link>
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Campaigns" value={String(campaigns.length)} icon={Mail} />
        <MetricCard label="Emails sent" value={formatNumber(totals.sent)} icon={Send} />
        <MetricCard
          label="Open rate"
          value={formatPercent(totals.openRate)}
          detail={`${formatNumber(totals.opened)} opened`}
          icon={Users}
        />
        <MetricCard
          label="Click rate"
          value={formatPercent(totals.clickRate)}
          detail={`${formatNumber(totals.clicked)} clicked`}
          icon={MousePointerClick}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Campaigns</h2>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
          {campaigns.map((campaign) => {
            const campaignTotals = sumEmailRecipients(campaign.recipients);
            return (
              <Link
                key={campaign.id}
                href={`/admin/campaigns/${campaign.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{campaign.name}</p>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {campaign.recipients.length} recipients
                    {campaignTotals.sent > 0 &&
                      ` · ${formatPercent(campaignTotals.openRate)} open rate · ${formatPercent(campaignTotals.clickRate)} click rate`}
                  </p>
                </div>
              </Link>
            );
          })}
          {campaigns.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground">
              No campaigns yet.{" "}
              <Link href="/admin/campaigns/new" className="text-primary hover:underline">
                Create one
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
