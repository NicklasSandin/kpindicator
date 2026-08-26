import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { CaseStudy } from "@/lib/content";
import { Badge } from "@/components/ui/badge";

export function ProofSection({ caseStudies }: { caseStudies: CaseStudy[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {caseStudies.map((cs) => (
        <Link
          key={cs.slug}
          href={`/case-studies/${cs.slug}`}
          className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
        >
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline">{cs.segment}</Badge>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">{cs.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{cs.dek}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4">
            {cs.metrics.slice(0, 2).map((m) => (
              <div key={m.label}>
                <dd className="text-xl font-semibold text-foreground">{m.value}</dd>
                <dt className="mt-0.5 text-xs text-muted-foreground">{m.label}</dt>
              </div>
            ))}
          </dl>
        </Link>
      ))}
    </div>
  );
}
