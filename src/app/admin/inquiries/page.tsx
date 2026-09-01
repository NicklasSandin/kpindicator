import type { Metadata } from "next";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { InquiryStatus } from "@/components/admin/inquiry-status";

export const metadata: Metadata = { title: { absolute: "Idea Reviews — KPIndicator Admin" } };

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Idea review requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Qualified requests from the public validation funnel, newest first.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {inquiries.map((inquiry) => (
          <article key={inquiry.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-foreground">{inquiry.name}</h2>
                <a href={`mailto:${inquiry.email}`} className="text-sm text-primary hover:underline">
                  {inquiry.email}
                </a>
                {inquiry.company && <span className="text-sm text-muted-foreground"> · {inquiry.company}</span>}
              </div>
              <div className="flex items-center gap-2">
                <InquiryStatus id={inquiry.id} status={inquiry.status} />
                <time className="text-xs text-muted-foreground" dateTime={inquiry.createdAt.toISOString()}>
                  {format(inquiry.createdAt, "MMM d, yyyy")}
                </time>
              </div>
            </div>

            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Stage" value={inquiry.currentStage} />
              <Detail label="Budget" value={inquiry.budget} />
              <Detail label="Decision timeline" value={inquiry.timeline} />
              <Detail label="Interest" value={inquiry.interest} />
            </div>
            <div className="mt-5 grid gap-5 border-t border-border pt-5 md:grid-cols-2">
              <Detail label="Idea" value={inquiry.message} />
              <Detail label="Target customer" value={inquiry.targetCustomer} />
              {inquiry.priorTests && <Detail label="Prior tests" value={inquiry.priorTests} />}
            </div>
          </article>
        ))}
        {inquiries.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No idea review requests yet.
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-foreground">{value || "Not provided"}</p>
    </div>
  );
}
