import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {params.invite
              ? "Create your account to join the team."
              : "Takes a minute. Just your name, email, and a password."}
          </p>
          <div className="mt-6">
            <SignupForm invitationToken={params.invite} invitedEmail={params.email} />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={params.invite ? `/login?invite=${encodeURIComponent(params.invite)}` : "/login"}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
