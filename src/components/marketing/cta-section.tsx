import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CTASection({
  title = "Stop guessing which idea is worth building.",
  description = "Start with a $995 Idea Check, or go straight to testing 3-5 ideas in market with a Validation Sprint.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center sm:px-12 sm:py-20">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_10%,transparent_100%)] opacity-30" />
      <div className="relative">
        <h2 className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </div>
    </div>
  );
}
