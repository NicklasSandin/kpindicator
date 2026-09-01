"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, setState] = React.useState<"idle" | "busy" | "done" | "error">("idle");

  async function unsubscribe() {
    setState("busy");
    const response = await fetch("/api/email/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    setState(response.ok ? "done" : "error");
  }

  if (state === "done") return <p className="mt-4 text-muted-foreground">You have been unsubscribed and will not receive future marketing campaigns from KPIndicator.</p>;
  return <>
    <p className="mt-4 text-muted-foreground">Stop marketing emails from KPIndicator at this address. Operational account emails are unaffected.</p>
    <Button className="mt-6" disabled={!token || state === "busy"} onClick={unsubscribe}>{state === "busy" ? "Updating…" : "Unsubscribe"}</Button>
    {state === "error" && <p className="mt-4 text-sm text-destructive">That link is invalid or no longer available.</p>}
  </>;
}
