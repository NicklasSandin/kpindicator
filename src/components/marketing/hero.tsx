import Link from "next/link";
import { ArrowRight, Radar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportPreview } from "@/components/marketing/report-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_40%,transparent_100%)] opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 -z-10 h-[36rem] w-[36rem] rounded-full bg-primary/20 opacity-30 blur-[120px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-medium">
              <Radar className="size-3" />
              Done-for-you demand testing
            </Badge>

            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Test what hits. Build what wins.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl lg:mx-0">
              We put real landing pages in front of real traffic for your 3-5 best ideas —
              paid ads, email, and outreach — and hand you a clear go / no-go before you
              spend a dollar building the wrong thing.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg" className="h-11 px-6 text-[15px]">
                <Link href="/pricing#idea-check">
                  Start with an Idea Check
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6 text-[15px]">
                <Link href="/contact">Book a validation call</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              $995 to know. $2,500 to test in market. No build until it&apos;s proven.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <ReportPreview />
            <p className="mt-3 text-center text-xs text-muted-foreground lg:text-right">
              A sample of what lands in your dashboard — not a mockup you have to imagine.
            </p>
          </div>
        </div>

        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 border-t border-border pt-10 sm:grid-cols-4 lg:mx-0 lg:max-w-none">
          {[
            { value: "3-5", label: "Ideas tested in parallel" },
            { value: "2-4", label: "Weeks to a clear answer" },
            { value: "100%", label: "Real traffic, no simulations" },
            { value: "1", label: "Written go / no-go call" },
          ].map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-semibold text-foreground sm:text-3xl">{stat.value}</dd>
              <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
