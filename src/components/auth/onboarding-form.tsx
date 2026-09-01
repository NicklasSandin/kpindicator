"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Rocket, TrendingUp, Compass, Loader2, ArrowRight, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS: {
  value: "STARTUP" | "INVESTOR" | "EXPLORER";
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    value: "STARTUP",
    icon: Rocket,
    title: "I'm building a startup",
    description: "I want an idea tested before I spend time or money building it.",
  },
  {
    value: "INVESTOR",
    icon: TrendingUp,
    title: "I'm an investor",
    description: "I want to see which ideas are actually proving demand.",
  },
  {
    value: "EXPLORER",
    icon: Compass,
    title: "Just exploring",
    description: "I want to look around and try the projects out for myself.",
  },
];

export function OnboardingForm() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<(typeof OPTIONS)[number]["value"] | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleContinue() {
    if (!selected) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience: selected }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              className={cn(
                "flex w-full items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40",
                active && "border-primary bg-primary/5 ring-1 ring-primary",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                  active && "bg-primary text-primary-foreground",
                )}
              >
                <option.icon className="size-4.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{option.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{option.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Button onClick={handleContinue} disabled={!selected || submitting} className="w-full">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Continue
      </Button>
    </div>
  );
}
