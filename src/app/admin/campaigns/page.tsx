import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { sumEmailRecipients } from "@/lib/email-metrics";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: { absolute: "Email campaigns — KPIndicator Admin" } };

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.emailCampaign.findMany({
    include: { recipients: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Email campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every outbound send, its audience, and how it performed.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/campaigns/new">New campaign</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {campaigns.map((campaign) => {
          const totals = sumEmailRecipients(campaign.recipients);
          return (
            <Link
              key={campaign.id}
              href={`/admin/campaigns/${campaign.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{campaign.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{campaign.subject}</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </div>
              <div className="mt-3">
                <StatusBadge status={campaign.status} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Recipients</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {formatNumber(campaign.recipients.length)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Open rate</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {totals.sent > 0 ? formatPercent(totals.openRate) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Click rate</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {totals.sent > 0 ? formatPercent(totals.clickRate) : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {campaign.sentAt ? `Sent ${formatDate(campaign.sentAt)}` : "Not sent yet"}
              </p>
            </Link>
          );
        })}
        {campaigns.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No campaigns yet.{" "}
            <Link href="/admin/campaigns/new" className="text-primary hover:underline">
              Create one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
