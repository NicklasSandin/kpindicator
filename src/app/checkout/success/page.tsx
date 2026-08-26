import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "You're in" };

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-status-go text-status-go-foreground">
          <CheckCircle2 className="size-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-foreground">Payment received</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll email you within one business day to kick off intake. In the meantime, your
          project will show up in the client dashboard once we&apos;ve set it up.
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
