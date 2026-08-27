import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { SimplePricingCards } from "@/components/marketing/simple-pricing-cards";
import { FitList } from "@/components/marketing/fit-list";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { CTASection } from "@/components/marketing/cta-section";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/format";
import { GROWTH_PACKAGES, GROWTH_FOR_YOU, GROWTH_FAQS } from "@/content/growth";

export const metadata: Metadata = {
  title: "Grow an Existing Product",
  description:
    "Already built it? We test new positioning, features, channels, and pricing against real traffic so your next growth bet is backed by evidence, not a hunch.",
};

export default function GrowPage() {
  const tiers = GROWTH_PACKAGES.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    tagline: pkg.tagline,
    priceLabel: formatCents(pkg.priceCents),
    duration: pkg.duration,
    includes: pkg.includes,
    featured: pkg.featured,
  }));

  return (
    <>
      <Section border={false} className="pb-8">
        <div className="mx-auto mb-5 max-w-2xl text-center">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
            <TrendingUp className="size-3" />
            For products that already exist
          </Badge>
        </div>
        <SectionHeading
          eyebrow="Grow"
          title="You already built it. Now find out what actually grows it."
          description="Same method we use to test unproven ideas, aimed at the product you already shipped — real traffic against a specific bet, not another internal debate about the roadmap."
        />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Packages"
          title="Pick where you need to start"
          description="Every package is priced flat. Diagnose what's stalling growth, test one specific bet, or test several in parallel."
        />
        <div className="mt-14">
          <SimplePricingCards
            tiers={tiers}
            ctaHref="/contact"
            ctaLabel="Book a growth call"
          />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Fit" title="Who this is built for" center={false} />
        <div className="mt-10">
          <FitList items={GROWTH_FOR_YOU} />
        </div>
      </Section>

      <Section border={false}>
        <SectionHeading eyebrow="FAQ" title="Questions worth answering upfront" />
        <div className="mx-auto mt-12 max-w-2xl">
          <FAQAccordion faqs={[...GROWTH_FAQS]} />
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection
          title="Stop guessing which growth bet is worth your quarter."
          description="Start with a $995 Growth Check, or go straight to testing a specific bet with a Growth Test."
          primaryHref="/grow#growth-check"
          primaryLabel="Start with a Growth Check"
          secondaryHref="/contact"
          secondaryLabel="Book a growth call"
        />
      </Section>
    </>
  );
}
