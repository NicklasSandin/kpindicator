import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnalyticsEvent } from "@/components/analytics-event";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "You're in" };

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const stripe = getStripe();
  let verified = false;
  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      verified = session.payment_status === "paid";
    } catch {
      verified = false;
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        {verified && <AnalyticsEvent event="checkout_completed" />}
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-go text-status-go-foreground">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-foreground">{verified ? "Payment received" : "Payment confirmation unavailable"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {verified
            ? "We'll email you within one business day to kick off intake. Your project will appear in the dashboard after scope is confirmed."
            : "We could not verify a paid Stripe session from this link. If you completed checkout, check your Stripe receipt or contact us before trying again."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
