import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const params = await searchParams;
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Log in to see what&apos;s in progress.</p>
          <div className="mt-6">
            <LoginForm invitationToken={params.invite} />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href={params.invite ? `/signup?invite=${encodeURIComponent(params.invite)}` : "/signup"}
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
