import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { CTASection } from "@/components/marketing/cta-section";
import { MDXContent } from "@/components/mdx-content";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, caseStudySchema } from "@/lib/seo";
import { getCaseStudies, getCaseStudy } from "@/lib/content";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return getCaseStudies().map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) return {};
  return { title: caseStudy.title, description: caseStudy.dek };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) notFound();

  return (
    <>
      <JsonLd
        schema={[
          caseStudySchema(caseStudy),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Case studies", path: "/case-studies" },
            { name: caseStudy.title, path: `/case-studies/${caseStudy.slug}` },
          ]),
        ]}
      />
      <Section border={false} className="pb-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All case studies
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{caseStudy.segment}</Badge>
            <Badge variant="secondary">{caseStudy.packageUsed}</Badge>
            <span className="text-xs text-muted-foreground">{caseStudy.timeframe}</span>
          </div>

          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {caseStudy.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{caseStudy.dek}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Published {formatDate(caseStudy.publishedAt)}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-4">
            {caseStudy.metrics.map((m) => (
              <div key={m.label}>
                <dd className="text-xl font-semibold text-foreground">{m.value}</dd>
                <dt className="mt-0.5 text-xs text-muted-foreground">{m.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl">
          <MDXContent source={caseStudy.body} />
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection />
      </Section>
    </>
  );
}
