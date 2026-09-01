import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { CTASection } from "@/components/marketing/cta-section";
import { Badge } from "@/components/ui/badge";
import { getCaseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "How the KPIndicator process reads in practice, across a startup studio, a corporate innovation team, and an agency.",
};

export default function CaseStudiesPage() {
  const caseStudies = getCaseStudies();

  return (
    <>
      <Section border={false} className="pb-8">
        <SectionHeading
          eyebrow="Case studies"
          title="How this reads in practice"
          description="Illustrative examples built to show how a KPIndicator report actually reads. Case studies from real client engagements are being published as they complete."
        />
      </Section>

      <Section>
        <div className="mx-auto grid max-w-4xl gap-5">
          {caseStudies.map((cs) => (
            <Link
              key={cs.slug}
              href={`/case-studies/${cs.slug}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{cs.segment}</Badge>
                  <Badge variant="secondary">{cs.packageUsed}</Badge>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-foreground">{cs.title}</h2>
              <p className="mt-2 text-muted-foreground">{cs.dek}</p>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
                {cs.metrics.map((m) => (
                  <div key={m.label}>
                    <dd className="text-lg font-semibold text-foreground">{m.value}</dd>
                    <dt className="mt-0.5 text-xs text-muted-foreground">{m.label}</dt>
                  </div>
                ))}
              </dl>
            </Link>
          ))}
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection />
      </Section>
    </>
  );
}
