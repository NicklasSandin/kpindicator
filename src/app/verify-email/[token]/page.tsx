import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { VerifyEmailButton } from "@/components/auth/email-verification-actions";

export const metadata: Metadata = { title: "Confirm your email" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getSessionUser();
  if (user?.emailVerifiedAt) redirect(user.audience ? "/dashboard" : "/onboarding");
  const loginHref = `/login?verify=${encodeURIComponent(token)}`;

  return <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16"><div className="w-full max-w-sm"><div className="mb-8 flex justify-center"><Logo /></div><div className="rounded-xl border border-border bg-card p-8 text-center"><h1 className="text-xl font-semibold">Confirm your email</h1><p className="mt-2 text-sm text-muted-foreground">{user ? `Verify ${user.email} to continue.` : "Log in to the account this verification link belongs to."}</p><div className="mt-6">{user ? <VerifyEmailButton token={token} /> : <Button asChild className="w-full"><Link href={loginHref}>Log in to verify</Link></Button>}</div></div></div></div>;
}
