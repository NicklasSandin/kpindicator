"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AcceptInvitationButton({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function accept() {
    setLoading(true);
    const response = await fetch("/api/team/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(data.error ?? "Could not accept the invitation.");
      setLoading(false);
      return;
    }
    router.push(data.redirect ?? "/dashboard");
    router.refresh();
  }

  return (
    <Button className="w-full" disabled={loading} onClick={accept}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
      Join team
    </Button>
  );
}
