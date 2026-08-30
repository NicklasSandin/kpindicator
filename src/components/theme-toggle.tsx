"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

/**
 * Light is the default; dark is opt-in.
 *
 * Deliberately not a sun/moon icon button — that component is the single most
 * copy-pasted element on the web and reads as template furniture. This is a
 * mono-labelled state control: it says which mode you are in, and the signal
 * dot fills when dark is active.
 *
 * The swap runs through the View Transitions API so the whole document
 * cross-fades instead of repainting instantly. Falls back to a plain set on
 * browsers without it, and skips the animation entirely under reduced motion.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggle = React.useCallback(() => {
    const next = isDark ? "light" : "dark";
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => unknown;
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || typeof doc.startViewTransition !== "function") {
      setTheme(next);
      return;
    }

    // flushSync so the DOM has actually changed before the snapshot is taken.
    doc.startViewTransition(() => flushSync(() => setTheme(next)));
  }, [isDark, setTheme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      className={cn(
        "eyebrow group inline-flex h-8 items-center gap-2 rounded-sm border border-border px-2.5",
        "text-muted-foreground transition-colors duration-300",
        "hover:border-foreground/30 hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full border transition-all duration-500",
          "ease-[cubic-bezier(.16,1,.3,1)]",
          isDark
            ? "border-signal bg-signal"
            : "border-current bg-transparent group-hover:bg-current/20",
        )}
      />
      {/* Fixed width so switching Light↔Dark never nudges the header. */}
      <span suppressHydrationWarning className="w-[3.1rem] text-left">
        {mounted ? (isDark ? "Dark" : "Light") : " "}
      </span>
    </button>
  );
}
