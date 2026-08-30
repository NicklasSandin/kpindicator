import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { ResendVerificationButton } from "@/components/auth/email-verification-actions";

export const metadata: Metadata = { title: "Verify your email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.emailVerifiedAt) redirect(user.audience ? "/dashboard" : "/onboarding");

  return <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16"><div className="w-full max-w-sm"><div className="mb-8 flex justify-center"><Logo /></div><div className="rounded-xl border border-border bg-card p-8 text-center"><h1 className="text-xl font-semibold">Check your email</h1><p className="mt-2 text-sm text-muted-foreground">We sent a verification link to <span className="font-medium text-foreground">{user.email}</span>. The link expires in 24 hours.</p><div className="mt-6"><ResendVerificationButton /></div><p className="mt-4 text-xs text-muted-foreground">You can close this page after opening the link.</p></div></div></div>;
}
