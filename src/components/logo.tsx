import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-baseline gap-2 font-display text-[19px] tracking-tight text-foreground",
        className,
      )}
    >
      <span className="relative flex size-2 shrink-0 self-center rounded-full bg-signal" />
      <span>
        KP<span className="text-signal-ink">Indicator</span>
      </span>
    </Link>
  );
}
