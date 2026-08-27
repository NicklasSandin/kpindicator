import Link from "next/link";
import { ArrowRight, Lightbulb, TrendingUp, Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

const SEGMENTS = [
  {
    href: "/validate",
    icon: Lightbulb,
    title: "I have an idea",
    description:
      "Test demand before you spend a dollar building. Real landing pages, real traffic, a clear go / no-go.",
    price: "From $995",
  },
  {
    href: "/grow",
    icon: TrendingUp,
    title: "I have a live product",
    description:
      "Test new positioning, features, channels, or pricing against real traffic before you bet a quarter on the wrong one.",
    price: "From $995",
  },
  {
    href: "/incorporate",
    icon: Building2,
    title: "I need a company",
    description:
      "Entity formation, banking, and compliance handled so a validated idea doesn't stall on paperwork.",
    price: "Book a call",
  },
] as const;

export function SegmentPicker() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {SEGMENTS.map((segment, i) => (
        <Link
          key={segment.href}
          href={segment.href}
          className={cn(
            "group flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 sm:p-7",
            i === 0 && "border-primary/50 ring-1 ring-primary/20",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <segment.icon className="size-5" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-foreground">{segment.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{segment.description}</p>
          <div className="mt-6 flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-muted-foreground">{segment.price}</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Start here
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
