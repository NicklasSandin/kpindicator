"use client";

import * as React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import type { PackageId } from "@/content/packages";
import { cn } from "@/lib/utils";

/**
 * When the PHP checkout (see /checkout) is deployed, buyers go straight there
 * and never touch /api/checkout. Unset, this falls back to the hosted Stripe
 * Checkout Session route, so neither surface is a hard dependency of the other.
 */
const CUSTOM_CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL;

export function CheckoutButton({
  packageId,
  label = "Get started",
  variant = "default",
  className,
}: {
  packageId: PackageId;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    if (posthog.__loaded) posthog.capture("checkout_started", { package_id: packageId });
    setLoading(true);

    // A full-page navigation, not a fetch: the PHP checkout renders the order
    // and creates the PaymentIntent itself, so there is nothing to ask for
    // first.
    if (CUSTOM_CHECKOUT_URL) {
      window.location.href = `${CUSTOM_CHECKOUT_URL.replace(/\/$/, "")}/?package=${encodeURIComponent(packageId)}`;
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();

      if (res.ok && data.url) {
        if (posthog.__loaded) posthog.capture("package_selected", { package_id: packageId });
        window.location.href = data.url;
        return;
      }

      toast.error(data.error ?? "Something went wrong starting checkout.", {
        description: "Book a call instead and we'll set it up manually.",
        action: { label: "Contact us", onClick: () => (window.location.href = "/contact") },
      });
    } catch {
      toast.error("Couldn't reach checkout. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      className={cn("group", className)}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : label}
      {!loading && (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" data-icon="inline-end" />
      )}
    </Button>
  );
}
