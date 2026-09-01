import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Hero } from "@/components/marketing/hero";
import { Section, SectionHeading } from "@/components/marketing/section";
import { ProcessSteps } from "@/components/marketing/process-steps";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { ProofSection } from "@/components/marketing/proof-section";
import { WhoItsFor } from "@/components/marketing/who-its-for";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { CTASection } from "@/components/marketing/cta-section";
import { AlternativesTable } from "@/components/marketing/alternatives-table";
import { Button } from "@/components/ui/button";
import { getCaseStudies } from "@/lib/content";
import { FAQS } from "@/content/faqs";

export const metadata: Metadata = {
  title: "Validate an Idea",
  description:
    "KPIndicator tests real offers with real prospects and gives you a clear go, pivot, or no-go recommendation before you fund the build.",
};

export default function ValidatePage() {
  const caseStudies = getCaseStudies();
  const topFaqs = FAQS.filter((f) => ["process", "results"].includes(f.category)).slice(0, 6);

  return (
    <>
      <Hero />

      <Section>
        <SectionHeading
          eyebrow="Why not just…"
          title="Everyone finds out eventually. The question is what it costs to find out."
          description="Three ways teams usually answer 'will this work,' and why none of them hold up next to real behavioral data."
        />
        <div className="mt-12">
          <AlternativesTable />
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Eight steps from idea to evidence"
          description="Every engagement follows the same disciplined process — the only thing that changes is how many ideas run through it at once."
        />
        <div className="mx-auto mt-14 max-w-2xl">
          <ProcessSteps compact />
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link href="/process">
              See the full process
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Packages"
          title="Pick where you need to start"
          description="Every package is priced per idea. Test one, or run a full batch of 3-5 at once."
        />
        <div className="mt-14">
          <PricingCards compact />
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link href="/pricing">
              Compare packages in detail
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Proof"
          title="What the process actually surfaces"
          description="Illustrative examples of the kind of result a real sprint produces — real case studies are being published as our founding cohort completes theirs."
        />
        <div className="mt-14">
          <ProofSection caseStudies={caseStudies} />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Fit" title="Who this is built for" center={false} />
        <div className="mt-10">
          <WhoItsFor />
        </div>
      </Section>

      <Section border={false}>
        <SectionHeading eyebrow="FAQ" title="Questions worth answering upfront" />
        <div className="mx-auto mt-12 max-w-2xl">
          <FAQAccordion faqs={topFaqs} />
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection />
      </Section>
    </>
  );
}
