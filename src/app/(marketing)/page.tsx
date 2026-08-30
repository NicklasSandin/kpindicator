import type { Metadata } from "next";
import Link from "next/link";

import { Mark, Rule, Section } from "@/components/marketing/section";
import { SegmentPicker } from "@/components/marketing/segment-picker";

export const metadata: Metadata = {
  title: "Know Before You Spend",
  description:
    "KPIndicator runs real tests against real traffic — validate a new idea, grow a product you've already built, or get incorporated properly. One team, three tracks.",
};

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden rule-b">
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-14 sm:px-8 sm:pt-28 sm:pb-20 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p
                className="eyebrow rise flex items-center gap-2.5 text-muted-foreground"
                style={{ "--i": 0 } as React.CSSProperties}
              >
                <span className="text-signal-ink tnum">00</span>
                <span aria-hidden className="text-border">—</span>
                <span>Done-for-you, from idea to entity</span>
              </p>

              <h1
                className="rise mt-7 font-display text-display text-foreground"
                style={{ "--i": 1 } as React.CSSProperties}
              >
                Know <Mark>before</Mark>
                <br />
                you spend.
              </h1>

              <Rule className="mt-9 max-w-md" animate />

              <p
                className="rise mt-9 measure text-lede text-muted-foreground"
                style={{ "--i": 3 } as React.CSSProperties}
              >
                We run real tests against real traffic so you don&apos;t guess —
                whether you&apos;re validating a new idea, growing something you
                already built, or need the legal entity to actually take money for it.
              </p>
            </div>

            {/* Positioning statement set as a pulled margin note. */}
            <aside
              className="rise self-end lg:col-span-4 lg:pb-2"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              <p className="border-l-2 border-signal pl-5 font-display text-xl leading-snug text-foreground/85 sm:text-2xl">
                We sell evidence,
                <br />
                not opinions.
              </p>
              <p className="eyebrow mt-4 pl-5 text-muted-foreground">
                Three tracks · one team
              </p>
            </aside>
          </div>

          <div
            className="rise mt-16 sm:mt-20"
            style={{ "--i": 5 } as React.CSSProperties}
          >
            <SegmentPicker />
          </div>
        </div>
      </section>

      <Section border={false} size="tight">
        <p className="measure-wide text-lede text-muted-foreground">
          Not sure which one fits?{" "}
          <Link
            href="/contact"
            className="link-underline font-medium text-foreground"
          >
            Book a call
          </Link>{" "}
          and we&apos;ll tell you honestly — including if the answer is
          &quot;none of them, yet.&quot;
        </p>
      </Section>
    </>
  );
}
