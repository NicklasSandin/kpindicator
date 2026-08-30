import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Editorial layout primitives.
 *
 * `Section` and `SectionHeading` keep their original props and defaults —
 * every marketing page imports them, and none should shift. What changed is
 * the treatment: display serif instead of `font-semibold tracking-tight`,
 * mono eyebrows, and a rhythm that can vary per band instead of one
 * metronomic py-24 everywhere.
 */

const SECTION_RHYTHM = {
  tight: "py-12 sm:py-16",
  default: "py-16 sm:py-24",
  loose: "py-24 sm:py-36",
} as const;

export function Section({
  children,
  className,
  border = true,
  size = "default",
  width = "default",
}: {
  children: ReactNode;
  className?: string;
  border?: boolean;
  size?: keyof typeof SECTION_RHYTHM;
  width?: "default" | "wide" | "narrow";
}) {
  return (
    <section className={cn(border && "rule-b", className)}>
      <div
        className={cn(
          "mx-auto px-5 sm:px-8 lg:px-10",
          SECTION_RHYTHM[size],
          width === "wide" && "max-w-7xl",
          width === "default" && "max-w-6xl",
          width === "narrow" && "max-w-3xl",
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Mono label: `01 — DEMAND TESTING`. The index sets in signal amber, the
 * label in muted ink. This is where the accent colour lives — not on buttons.
 */
export function Eyebrow({
  index,
  children,
  className,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("eyebrow flex items-center gap-2.5 text-muted-foreground", className)}>
      {index && (
        <>
          <span className="text-signal-ink tnum">{index}</span>
          <span aria-hidden className="text-border">
            —
          </span>
        </>
      )}
      <span>{children}</span>
    </p>
  );
}

/** Display-serif heading. Always 400 — the size carries it, not the weight. */
export function DisplayHeading({
  as: Comp = "h2",
  level = "title",
  children,
  className,
}: {
  as?: ElementType;
  level?: "display" | "title";
  children: ReactNode;
  className?: string;
}) {
  return (
    <Comp
      className={cn(
        "font-display text-foreground",
        level === "display" ? "text-display" : "text-title",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

/** A word set in display italic + signal amber. One per headline, at most. */
export function Mark({ children }: { children: ReactNode }) {
  return <em className="text-signal-ink italic">{children}</em>;
}

/** Hairline with a short signal-amber lead-in. */
export function Rule({ className, animate = false }: { className?: string; animate?: boolean }) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className={cn("h-px w-10 bg-signal", animate && "draw")} />
      <span className={cn("h-px flex-1 bg-rule", animate && "draw")} />
    </div>
  );
}

/**
 * Scroll-driven reveal. Pure CSS (`animation-timeline: view()`), so there is
 * no observer and no hydration cost. Browsers without support render the
 * final state — the animation simply never attaches.
 */
export function Reveal({
  children,
  className,
  as: Comp = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Comp className={cn("reveal", className)}>{children}</Comp>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && (
        <Eyebrow className={cn(center && "justify-center")}>{eyebrow}</Eyebrow>
      )}
      <DisplayHeading className={cn(eyebrow && "mt-4")}>{title}</DisplayHeading>
      {description && (
        <p
          className={cn(
            "mt-5 text-lede text-muted-foreground",
            center ? "mx-auto measure" : "measure",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
