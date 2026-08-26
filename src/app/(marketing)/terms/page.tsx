import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/marketing/section";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <Section border={false} className="pb-24">
      <SectionHeading eyebrow="Legal" title="Terms of Service" center={false} />
      <div className="mx-auto mt-10 max-w-2xl space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p className="rounded-lg border border-border bg-card p-4 text-foreground/90">
          Placeholder terms for demo purposes. Have counsel review and finalize this before
          taking real client engagements.
        </p>
        <div>
          <h2 className="text-base font-semibold text-foreground">What we deliver</h2>
          <p className="mt-2">
            Each package&apos;s scope, timeline, and deliverables are as described on the Pricing page
            at time of purchase. Media/ad spend is separate from our fee and is agreed with you in
            writing before any campaign goes live.
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">What &quot;success&quot; means</h2>
          <p className="mt-2">
            We do not guarantee that any tested idea will validate. We guarantee a rigorous test
            run against thresholds agreed with you in advance, and a written report on the result —
            go, no-go, or inconclusive are all complete, delivered outcomes.
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Ownership</h2>
          <p className="mt-2">
            You own the domain/subdomain, landing pages, analytics accounts, collected leads, and
            all reports produced during the engagement, whether or not you continue working with
            us afterward.
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Payment & refunds</h2>
          <p className="mt-2">
            Packages are billed upfront via Stripe. Refund eligibility, if any, is specified in
            your engagement agreement — this page is a summary, not the governing contract.
          </p>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p className="mt-2">Questions about these terms: reach us via the contact page.</p>
        </div>
      </div>
    </Section>
  );
}
