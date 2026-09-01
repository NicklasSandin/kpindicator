"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CampaignActions({ campaignId, canSend }: { campaignId: string; canSend: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"test" | "send" | null>(null);
  const [testEmail, setTestEmail] = React.useState("");

  async function test() {
    setBusy("test");
    const response = await fetch(`/api/admin/email-campaigns/${campaignId}/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmail }) });
    const data = await response.json().catch(() => ({}));
    if (response.ok) toast.success("Test email sent. No campaign state changed.");
    else toast.error(data.error || "Test send failed.");
    setBusy(null);
  }

  async function send() {
    if (!window.confirm("Send this campaign to all pending recipients now? Suppressed recipients will be skipped.")) return;
    setBusy("send");
    const response = await fetch(`/api/admin/email-campaigns/${campaignId}/send`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) toast.success(`Sent ${data.sent}; failed ${data.failed}; remaining ${data.remaining}.`);
    else toast.error(data.error || "Campaign send failed.");
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Review and send</h2>
      <p className="mt-1 text-xs text-muted-foreground">Test first. Starting a campaign is an explicit, real external send.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} placeholder="Test address" />
        <Button type="button" variant="outline" disabled={!testEmail || busy !== null || !canSend} onClick={test}>
          {busy === "test" && <Loader2 className="size-4 animate-spin" />} Send test
        </Button>
        <Button type="button" disabled={busy !== null || !canSend} onClick={send}>
          {busy === "send" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send pending
        </Button>
      </div>
      {!canSend && <p className="mt-3 text-xs text-amber-600">Sending is unavailable until SES credentials, SES_FROM_EMAIL, and EMAIL_PHYSICAL_ADDRESS are configured.</p>}
    </div>
  );
}
