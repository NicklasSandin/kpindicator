import { Check, KeyRound, Ban, FileCheck2 } from "lucide-react";

import { PACKAGES } from "@/content/packages";
import { formatCents } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/marketing/checkout-button";
import { cn } from "@/lib/utils";

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.id}
            id={pkg.id}
            className={cn(
              "flex scroll-mt-24 flex-col rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
              pkg.featured
                ? "border-primary/50 ring-1 ring-primary/20"
                : "hover:border-primary/40",
            )}
          >
            {pkg.featured && (
              <Badge className="mb-3 w-fit">Most popular</Badge>
            )}
            <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{pkg.tagline}</p>

            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                {formatCents(pkg.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">/ idea</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{pkg.duration}</p>

            {!compact && (
              <ul className="mt-6 space-y-2.5">
                {pkg.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto pt-6">
              <CheckoutButton
                packageId={pkg.id}
                variant={pkg.featured ? "default" : "outline"}
                label={`Start ${pkg.name}`}
                className="w-full"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 border-t border-border pt-8 sm:flex-row sm:justify-center sm:gap-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ban className="size-4 shrink-0 text-primary" />
          No retainer, ever
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <KeyRound className="size-4 shrink-0 text-primary" />
          You keep the domain, data & leads either way
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileCheck2 className="size-4 shrink-0 text-primary" />
          A no-go is a complete, written answer
        </div>
      </div>
    </div>
  );
}
