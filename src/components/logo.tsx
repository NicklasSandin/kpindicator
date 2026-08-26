import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span className="relative flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-black/10" />
        <span className="size-1.5 rounded-full bg-current" />
      </span>
      What<span className="text-primary">Hits</span>
    </Link>
  );
}
