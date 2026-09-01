"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ResendVerificationButton() {
  const [loading, setLoading] = React.useState(false);
  async function resend() {
    setLoading(true);
    const response = await fetch("/api/auth/resend-verification", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return toast.error(data.error ?? "Could not send another email.");
    toast.success("Verification email sent.");
  }
  return <Button variant="outline" className="w-full" disabled={loading} onClick={resend}>{loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Resend verification email</Button>;
}

export function VerifyEmailButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  async function verify() {
    setLoading(true);
    const response = await fetch("/api/auth/verify-email", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setLoading(false); return toast.error(data.error ?? "Could not verify your email."); }
    toast.success("Email verified.");
    router.push(data.redirect ?? "/onboarding"); router.refresh();
  }
  return <Button className="w-full" disabled={loading} onClick={verify}>{loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Verify email</Button>;
}
