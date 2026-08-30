import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Mark, Rule } from "@/components/marketing/section";
import { ReportPreview } from "@/components/marketing/report-preview";

const FIGURES = [
  { value: "3–5", label: "Ideas tested in parallel" },
  { value: "2–4", label: "Weeks to a clear answer" },
  { value: "100%", label: "Real traffic, no simulations" },
  { value: "1", label: "Written go / no-go call" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden rule-b">
      <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-16 sm:px-8 sm:pt-24 sm:pb-20 lg:px-10">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Left column runs wide and stays left-aligned. Centred hero copy
              is the fastest way to read as a template. */}
          <div className="lg:col-span-7">
            <p className="eyebrow rise flex items-center gap-2.5 text-muted-foreground" style={{ "--i": 0 } as React.CSSProperties}>
              <span className="text-signal-ink tnum">01</span>
              <span aria-hidden className="text-border">—</span>
              <span>Done-for-you demand testing</span>
            </p>

            <h1
              className="rise mt-7 font-display text-display text-foreground"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Test what <Mark>hits</Mark>.
              <br />
              Build what wins.
            </h1>

            <Rule className="mt-9 max-w-sm" animate />

            <p
              className="rise mt-9 measure text-lede text-muted-foreground"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              We put real landing pages in front of real traffic for your 3–5 best
              ideas — paid ads, email, and outreach — and hand you a clear go / no-go
              before you spend a dollar building the wrong thing.
            </p>

            <div
              className="rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <Button asChild size="lg" className="h-11 rounded-sm px-6 text-[15px]">
                <Link href="/pricing#idea-check">
                  Start with an Idea Check
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
              <Link
                href="/contact"
                className="link-underline text-[15px] font-medium text-foreground"
              >
                Book a validation call
              </Link>
            </div>

            <p
              className="rise mt-7 font-mono text-xs text-muted-foreground tnum"
              style={{ "--i": 5 } as React.CSSProperties}
            >
              $995 to know · $2,500 to test in market · no build until it&apos;s proven
            </p>
          </div>

          {/* Figure column, dropped below the headline baseline and captioned
              like a report exhibit rather than floated as a hero graphic. */}
          <figure
            className="rise lg:col-span-5 lg:pt-20"
            style={{ "--i": 6 } as React.CSSProperties}
          >
            <ReportPreview />
            <figcaption className="eyebrow mt-4 flex gap-2.5 text-muted-foreground">
              <span className="text-signal-ink">Fig. 1</span>
              <span aria-hidden className="text-border">—</span>
              <span className="normal-case tracking-normal font-sans text-xs">
                Live client dashboard. Not a mockup you have to imagine.
              </span>
            </figcaption>
          </figure>
        </div>

        {/* Figures table. Mono, tabular, ruled — a report's numbers, not a
            row of centred template stats. */}
        <dl className="mt-20 grid grid-cols-2 gap-x-10 rule-t pt-8 sm:grid-cols-4">
          {FIGURES.map((figure) => (
            <div
              key={figure.label}
              className="reveal border-rule sm:border-l sm:first:border-l-0 sm:pl-6 sm:first:pl-0"
            >
              <dt className="sr-only">{figure.label}</dt>
              <dd className="font-display text-4xl text-foreground tnum sm:text-5xl">
                {figure.value}
              </dd>
              <dd className="eyebrow mt-3 max-w-[16ch] text-muted-foreground">
                {figure.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
