import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { sumEmailRecipients } from "@/lib/email-metrics";
import { formatDate, formatPercent } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/metric-card";
import { EmailFunnel } from "@/components/admin/email-funnel";
import { RecipientTable } from "@/components/admin/recipient-table";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
  return { title: { absolute: `${campaign?.name ?? "Campaign"} — WhatHits Admin` } };
}

export default async function AdminCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id },
    include: { recipients: true },
  });

  if (!campaign) notFound();

  const totals = sumEmailRecipients(campaign.recipients);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/admin/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All campaigns
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={campaign.status} />
            {campaign.audience && <Badge variant="outline">{campaign.audience}</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{campaign.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">&quot;{campaign.subject}&quot;</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {campaign.sentAt ? <p>Sent {formatDate(campaign.sentAt)}</p> : <p>Not sent yet</p>}
          {campaign.fromEmail && (
            <p className="mt-0.5">
              From {campaign.fromName ? `${campaign.fromName} ` : ""}&lt;{campaign.fromEmail}&gt;
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Recipients" value={String(campaign.recipients.length)} />
        <MetricCard label="Open rate" value={totals.sent > 0 ? formatPercent(totals.openRate) : "—"} detail={`${totals.opened} opened`} />
        <MetricCard label="Click rate" value={totals.sent > 0 ? formatPercent(totals.clickRate) : "—"} detail={`${totals.clicked} clicked`} />
        <MetricCard label="Bounce rate" value={totals.sent > 0 ? formatPercent(totals.bounceRate) : "—"} detail={`${totals.bounced} bounced`} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Funnel</h2>
          <div className="mt-4">
            <EmailFunnel
              sent={totals.sent}
              delivered={totals.delivered}
              opened={totals.opened}
              clicked={totals.clicked}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Signals worth a closer look</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Click-to-open rate</dt>
              <dd className="font-medium text-foreground">
                {totals.opened > 0 ? formatPercent(totals.clickToOpenRate) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Unsubscribed</dt>
              <dd className="font-medium text-foreground">{totals.unsubscribed}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Bounced</dt>
              <dd className="font-medium text-foreground">{totals.bounced}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Not yet engaged</dt>
              <dd className="font-medium text-foreground">
                {totals.sent - totals.opened - totals.bounced - totals.unsubscribed}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          Recipients <span className="text-muted-foreground">({campaign.recipients.length})</span>
        </h2>
        <div className="mt-4">
          <RecipientTable recipients={campaign.recipients} />
        </div>
      </div>
    </div>
  );
}
