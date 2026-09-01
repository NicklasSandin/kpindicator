import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { googleOAuthConfig } from "@/lib/google-oauth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ invite?: string; verify?: string; error?: string }> }) {
  const params = await searchParams;
  const next = params.invite ? `/invite/${params.invite}` : params.verify ? `/verify-email/${params.verify}` : undefined;
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
            {params.error && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{googleErrorMessage(params.error)}</p>}
            <GoogleAuthButton enabled={Boolean(googleOAuthConfig())} next={next} />
            <LoginForm invitationToken={params.invite} verificationToken={params.verify} />
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

function googleErrorMessage(error: string) {
  if (error === "google_not_configured") return "Google login is not configured yet.";
  if (error === "google_denied") return "Google login was cancelled.";
  if (error === "rate_limited") return "Too many login attempts. Please wait and try again.";
  return "Google login could not be completed. Please try again or use email and password.";
}
