import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CTASection({
  title = "Stop guessing which idea is worth building.",
  description = "Start with a $995 Idea Check, or go straight to testing 3-5 ideas in market with a Validation Sprint.",
  primaryHref = "/pricing#idea-check",
  primaryLabel = "Start with an Idea Check",
  secondaryHref = "/contact",
  secondaryLabel = "Book a validation call",
  footnote = "Flat pricing. No retainer. You keep everything either way.",
}: {
  title?: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  footnote?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 opacity-40 blur-[100px]"
      />
      <div className="relative">
        <h2 className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-6 text-[15px]">
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-6 text-[15px]">
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">{footnote}</p>
      </div>
    </div>
  );
}
