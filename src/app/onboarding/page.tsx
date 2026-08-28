import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata: Metadata = { title: "Tell us about yourself" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.audience) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold text-foreground">One quick thing</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Which of these sounds like you? It just helps us show you the right things.
          </p>
          <div className="mt-6">
            <OnboardingForm />
          </div>
        </div>
      </div>
    </div>
  );
}
