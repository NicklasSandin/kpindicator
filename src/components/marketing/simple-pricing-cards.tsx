import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SimpleTier {
  id: string;
  name: string;
  tagline: string;
  priceLabel: string;
  priceSuffix?: string;
  duration?: string;
  includes: string[];
  featured?: boolean;
}

export function SimplePricingCards({
  tiers,
  ctaHref,
  ctaLabel,
}: {
  tiers: SimpleTier[];
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          id={tier.id}
          className={cn(
            "flex scroll-mt-24 flex-col rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
            tier.featured ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/40",
          )}
        >
          {tier.featured && <Badge className="mb-3 w-fit">Most popular</Badge>}
          <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{tier.tagline}</p>

          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              {tier.priceLabel}
            </span>
            {tier.priceSuffix && (
              <span className="text-sm text-muted-foreground">{tier.priceSuffix}</span>
            )}
          </div>
          {tier.duration && <p className="mt-1 text-xs text-muted-foreground">{tier.duration}</p>}

          <ul className="mt-6 space-y-2.5">
            {tier.includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground/90">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-6">
            <Button
              asChild
              variant={tier.featured ? "default" : "outline"}
              className="w-full"
            >
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
