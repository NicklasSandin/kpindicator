import type { Metadata } from "next";

import { Section, SectionHeading } from "@/components/marketing/section";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata: Metadata = {
  title: "About",
  description:
    "WhatHits exists because building first and validating later is the most expensive way to find out an idea doesn't work. Here's how we operate instead.",
};

const VALUES = [
  {
    title: "Evidence over opinion",
    detail:
      "Internal debates about which idea is 'obviously' the right one get settled by data from outside the building, not by whoever argues loudest in the room.",
  },
  {
    title: "Speed without shortcuts",
    detail:
      "Fast doesn't mean sloppy. We compress the calendar, not the rigor — real traffic, real thresholds, real sample sizes, just run efficiently.",
  },
  {
    title: "Say the uncomfortable thing",
    detail:
      "If the data says no, we say no — in writing, with the reasoning attached. A validation partner who only ever says yes isn't validating anything.",
  },
  {
    title: "Leave clients better equipped, not dependent",
    detail:
      "You get the domain, the dashboard, the leads, and the report. Whether or not you build with us, you're not locked into needing us again.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Section border={false} className="pb-8">
        <SectionHeading
          eyebrow="About"
          title="We got tired of watching good teams build the wrong thing well"
          description="WhatHits exists because 'build first, validate later' is the most expensive way to find out an idea doesn't work — and almost everyone still does it that way."
        />
      </Section>

      <Section>
        <div className="mx-auto max-w-2xl space-y-5 text-[15px] leading-relaxed text-foreground/90">
          <p>
            Most product failures aren&apos;t engineering failures. The thing usually works exactly as
            designed — it just turns out nobody wanted it enough to pay for it, and that discovery
            arrives six months and a real budget too late to be cheap.
          </p>
          <p>
            The standard fixes don&apos;t actually fix this. &quot;Talk to customers&quot; produces generous
            conversation and unreliable signal — people are polite in interviews and honest with their
            wallets. &quot;Build an MVP and see&quot; still requires building something first, which is the
            exact expense you were trying to avoid finding out about. And the recent wave of AI
            &quot;validation&quot; tools mostly generate plausible-sounding opinions from a prompt, dressed up
            as market research.
          </p>
          <p>
            We built WhatHits to run the test that actually answers the question: put a specific offer
            in front of real people, spend real budget getting it seen, and measure what they actually
            do. Not what they say they&apos;d do. Not what a model predicts they&apos;d do. What they
            click, sign up for, and pay a deposit toward.
          </p>
          <p>
            We work like an in-house growth team you can rent for three weeks instead of an agency
            selling you a retainer — because that&apos;s the model that gets you a straight answer fastest,
            and then gets out of the way once you have it.
          </p>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="How we operate" title="What we actually believe" center={false} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section border={false} className="pt-0">
        <CTASection
          title="Ready to find out for sure?"
          description="Start with an Idea Check, or book a call if you want to talk through which package fits first."
        />
      </Section>
    </>
  );
}
