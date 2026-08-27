import type { Metadata } from "next";
import Link from "next/link";
import { Radar } from "lucide-react";

import { Section } from "@/components/marketing/section";
import { SegmentPicker } from "@/components/marketing/segment-picker";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Know Before You Spend",
  description:
    "KPIndicator runs real tests against real traffic — validate a new idea, grow a product you've already built, or get incorporated properly. One team, three tracks.",
};

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)] opacity-40" />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 -z-10 h-[36rem] w-[36rem] rounded-full bg-primary/20 opacity-30 blur-[120px]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
              <Radar className="size-3" />
              Done-for-you, from idea to entity
            </Badge>

            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Know before you spend.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
              We run real tests against real traffic so you don&apos;t guess — whether
              you&apos;re validating a new idea, growing something you already built, or need
              the legal entity to actually take money for it.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-4xl">
            <SegmentPicker />
          </div>
        </div>
      </section>

      <Section border={false}>
        <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
          Not sure which one fits?{" "}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Book a call
          </Link>{" "}
          and we&apos;ll tell you honestly — including if the answer is &quot;none of them, yet.&quot;
        </p>
      </Section>
    </>
  );
}
