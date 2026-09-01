import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Radar, ShieldCheck } from "lucide-react";

import { AlternativesTable } from "@/components/marketing/alternatives-table";
import { CTASection } from "@/components/marketing/cta-section";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { ProcessSteps } from "@/components/marketing/process-steps";
import { ProofSection } from "@/components/marketing/proof-section";
import { Section, SectionHeading } from "@/components/marketing/section";
import { WhoItsFor } from "@/components/marketing/who-its-for";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCaseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Know Which Idea Customers Want Before You Build It",
  description:
    "KPIndicator tests your offer with a real landing page, targeted outreach, and measurable buyer behavior—then gives you a clear go, pivot, or no-go recommendation.",
};

const OUTCOMES = [
  "A real offer and conversion-focused landing page",
  "Targeted traffic and outreach to likely buyers",
  "Qualified demand signals—not survey opinions",
  "A clear go, pivot, or no-go recommendation",
];

export default function HomePage() {
  const caseStudies = getCaseStudies();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)] opacity-40" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
          <div>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
              <Radar className="size-3" />
              Done-for-you demand validation
            </Badge>
            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Know which idea customers want before you build it.
            </h1>
            <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
              We put your offer in front of real prospects, measure who visits, responds,
              signs up, books, or pays, and give you a clear recommendation before you fund
              the full build.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact?interest=idea-review">
                  Request an idea review
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/process">See how the test works</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              A straight answer on fit within one business day. No hard sell.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              What you get instead of another opinion
            </div>
            <ul className="mt-6 space-y-4">
              {OUTCOMES.map((outcome) => (
                <li key={outcome} className="flex gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {outcome}
                </li>
              ))}
            </ul>
            <div className="mt-7 border-t border-border pt-6">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Best place to start
              </p>
              <p className="mt-2 font-semibold text-foreground">Market Test · $2,500 · 2 weeks</p>
              <p className="mt-1 text-sm text-muted-foreground">
                One idea, one live test, and evidence you can use to make the build decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="The expensive mistake"
          title="Building is the most expensive way to learn that nobody wants it"
          description="Interviews and surveys tell you what people say. A demand test shows what they do when the offer, price, and next step are real."
        />
        <div className="mt-12"><AlternativesTable /></div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="From idea to evidence in a controlled test"
          description="We agree on the threshold first, build the test, bring in qualified prospects, and report the decision the evidence supports."
        />
        <div className="mx-auto mt-14 max-w-2xl"><ProcessSteps compact /></div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Packages"
          title="Start with the amount of proof the decision needs"
          description="Test one idea, compare several directions, or ask buyers for the strongest signal: a booking, deposit, or preorder."
        />
        <div className="mt-14"><PricingCards compact /></div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Example evidence"
          title="See what a decision-ready result looks like"
          description="These examples are explicitly illustrative—not customer claims—so you can inspect the metrics, caveats, and recommendation before buying."
        />
        <div className="mt-14"><ProofSection caseStudies={caseStudies} /></div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Fit" title="Built for teams with a real build decision ahead" />
        <div className="mt-10"><WhoItsFor /></div>
      </Section>

      <Section border={false}>
        <CTASection
          title="Before you build, find out what buyers do"
          description="Tell us the idea and who it is for. We'll send you a quick validation angle and tell you honestly whether a paid test makes sense."
        />
      </Section>
    </>
  );
}
