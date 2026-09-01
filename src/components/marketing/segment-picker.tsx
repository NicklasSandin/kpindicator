import Link from "next/link";

import { cn } from "@/lib/utils";

const SEGMENTS = [
  {
    href: "/validate",
    index: "01",
    title: "I have an idea",
    description:
      "Test demand before you spend a dollar building. Real landing pages, real traffic, a clear go / no-go.",
    price: "From $995",
  },
  {
    href: "/grow",
    index: "02",
    title: "I have a live product",
    description:
      "Test new positioning, features, channels, or pricing against real traffic before you spend three months on the wrong one.",
    price: "From $995",
  },
  {
    href: "/incorporate",
    index: "03",
    title: "I need a company",
    description:
      "We register the company, open the banking, and handle compliance, so a validated idea doesn't stall on paperwork.",
    price: "Book a call",
  },
] as const;

/**
 * A report's table of contents, not a row of feature cards.
 *
 * No icon chips, no rounded card, no hover-lift-and-shadow — those three
 * together are the most reliable tell of a generated marketing page. The
 * hierarchy here comes from a ruled grid and a display numeral instead.
 */
export function SegmentPicker() {
  return (
    <div className="grid rule-t sm:grid-cols-3">
      {SEGMENTS.map((segment) => (
        <Link
          key={segment.href}
          href={segment.href}
          className={cn(
            "group relative flex flex-col border-b border-rule px-1 py-7",
            "sm:border-b-0 sm:border-l sm:px-6 sm:py-8",
            "sm:first:border-l-0 sm:first:pl-1",
            "transition-colors duration-300 hover:bg-card",
          )}
        >
          {/* Signal rule draws across the top on hover. */}
          <span
            aria-hidden
            className="absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-signal transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100"
          />

          <span className="font-display text-3xl leading-none text-signal-ink tnum">
            {segment.index}
          </span>

          <h3 className="mt-5 font-display text-2xl leading-tight text-foreground">
            {segment.title}
          </h3>

          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {segment.description}
          </p>

          <div className="mt-7 flex items-baseline justify-between gap-4">
            <span className="eyebrow text-muted-foreground">{segment.price}</span>
            <span className="link-underline text-sm font-medium text-foreground group-hover:bg-[length:100%_1px]">
              Start here
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
