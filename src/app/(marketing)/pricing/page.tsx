import type { Metadata } from "next";
import { Timer } from "lucide-react";

import { JsonLd } from "@/components/json-ld";
import { serviceSchemas } from "@/lib/seo";
import { Section, SectionHeading } from "@/components/marketing/section";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { PricingComparisonTable } from "@/components/marketing/pricing-comparison-table";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { CTASection } from "@/components/marketing/cta-section";
import { Badge } from "@/components/ui/badge";
import { FAQS } from "@/content/faqs";
import { AnalyticsEvent } from "@/components/analytics-event";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Idea Check ($995), Market Test ($2,500), Validation Sprint ($4,900), and Presale Sprint ($8,500) — flat, per-idea pricing for done-for-you demand testing.",
};

export default function PricingPage() {
  const pricingFaqs = FAQS.filter((f) => f.category === "pricing");

  return (
    <>
      <JsonLd schema={serviceSchemas()} />
      <AnalyticsEvent event="pricing_viewed" />
      <Section border={false} className="pb-8">
        <div className="mx-auto mb-5 max-w-2xl text-center">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
            <Timer className="size-3" />
            Founding cohort — first 5-10 clients only
          </Badge>
        </div>
        <SectionHeading
          eyebrow="Pricing"
          title="Flat pricing, per idea"
          description="No retainers, no vague 'growth partnership.' You know the price before we start, and what you get for it."
        />
      </Section>

      <Section>
        <PricingCards />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Detailed comparison"
          title="What's actually included"
          description="Every package builds on the one before it. Here's exactly where the line sits."
        />
        <div className="mt-12">
          <PricingComparisonTable />
        </div>
      </Section>

      <Section border={false}>
        <SectionHeading eyebrow="Pricing FAQ" title="Money questions, answered directly" />
        <div className="mx-auto mt-12 max-w-2xl">
          <FAQAccordion faqs={pricingFaqs} />
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection
          title="Not sure which package fits?"
          description="Book a 20-minute call and we'll tell you honestly — including if the answer is 'none of them, yet.'"
        />
      </Section>
    </>
  );
}
