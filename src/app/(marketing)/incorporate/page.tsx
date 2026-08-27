import type { Metadata } from "next";
import { Building2 } from "lucide-react";

import { Section, SectionHeading } from "@/components/marketing/section";
import { SimplePricingCards } from "@/components/marketing/simple-pricing-cards";
import { FitList } from "@/components/marketing/fit-list";
import { FAQAccordion } from "@/components/marketing/faq-accordion";
import { CTASection } from "@/components/marketing/cta-section";
import { Badge } from "@/components/ui/badge";
import { INCORPORATE_PACKAGES, INCORPORATE_FOR_YOU, INCORPORATE_FAQS } from "@/content/incorporate";

export const metadata: Metadata = {
  title: "Company Formation",
  description:
    "Entity formation, banking setup, and compliance handled so a validated idea doesn't stall on paperwork — a service line alongside KPIndicator's validation and growth work.",
};

export default function IncorporatePage() {
  const tiers = INCORPORATE_PACKAGES.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    tagline: pkg.tagline,
    priceLabel: "Custom",
    priceSuffix: "book a call",
    includes: pkg.includes,
    featured: pkg.featured,
  }));

  return (
    <>
      <Section border={false} className="pb-8">
        <div className="mx-auto mb-5 max-w-2xl text-center">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
            <Building2 className="size-3" />
            A KPIndicator service line
          </Badge>
        </div>
        <SectionHeading
          eyebrow="Incorporate"
          title="Need a company before you can take the money?"
          description="We handle entity formation, banking, and compliance so a validated idea — or a business you're already running — doesn't stall on paperwork."
        />
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Packages"
          title="Pick where you need to start"
          description="Every tier is quoted directly — formation costs vary by jurisdiction and entity type, so we'll give you a specific number before anything's filed."
        />
        <div className="mt-14">
          <SimplePricingCards
            tiers={tiers}
            ctaHref="/contact"
            ctaLabel="Book a formation call"
          />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Fit" title="Who this is built for" center={false} />
        <div className="mt-10">
          <FitList items={INCORPORATE_FOR_YOU} />
        </div>
      </Section>

      <Section border={false}>
        <SectionHeading eyebrow="FAQ" title="Questions worth answering upfront" />
        <div className="mx-auto mt-12 max-w-2xl">
          <FAQAccordion faqs={[...INCORPORATE_FAQS]} />
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection
          title="Get the entity right before you need it."
          description="Book a call and we'll tell you exactly which structure fits and what it costs."
          primaryHref="/contact"
          primaryLabel="Book a formation call"
          secondaryHref="/validate"
          secondaryLabel="Not incorporated yet? Validate first"
          footnote="No retainer. You keep the entity and everything in it, either way."
        />
      </Section>
    </>
  );
}
