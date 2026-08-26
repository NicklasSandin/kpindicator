import type { Metadata } from "next";

import { Section, SectionHeading } from "@/components/marketing/section";
import { ProcessSteps } from "@/components/marketing/process-steps";
import { CTASection } from "@/components/marketing/cta-section";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Process",
  description:
    "The eight-step process WhatHits runs on every engagement: intake, positioning, landing pages, multi-channel demand testing, measurement, qualification, reporting, and build.",
};

const PRINCIPLES = [
  {
    title: "Real traffic, not simulated interest",
    detail:
      "No AI persona surveys, no synthetic focus groups. Every number in your report came from a real person clicking a real ad or opening a real email.",
  },
  {
    title: "Thresholds set before we start, not after",
    detail:
      "We agree on what counts as a go signal before any traffic runs — so the result can't quietly get reframed once we see it.",
  },
  {
    title: "You own everything, always",
    detail:
      "The domain, the analytics, the leads, the report. If you never work with us again after this, you leave with more than you came in with.",
  },
  {
    title: "A no-go is a valid, complete outcome",
    detail:
      "We're not incentivized to tell you what you want to hear — we're incentivized to tell you what's true, quickly, before you've spent real money finding out the hard way.",
  },
];

export default function ProcessPage() {
  return (
    <>
      <Section border={false} className="pb-8">
        <SectionHeading
          eyebrow="Process"
          title="The same disciplined process, every time"
          description="Whether we're testing one idea or five, the process doesn't change — only how many times it runs in parallel."
        />
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl">
          <ProcessSteps />
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Principles" title="What makes this different from guessing faster" center={false} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section border={false}>
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">Try it yourself</Badge>
          <h2 className="text-2xl font-semibold text-foreground">
            See what a finished report actually looks like
          </h2>
          <p className="mt-3 text-muted-foreground">
            The client dashboard has a real sample project running through the full process, including a
            published validation report.
          </p>
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection />
      </Section>
    </>
  );
}
