"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NewCampaignForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      previewText: String(formData.get("previewText") ?? ""),
      fromName: String(formData.get("fromName") ?? ""),
      fromEmail: String(formData.get("fromEmail") ?? ""),
      audience: String(formData.get("audience") ?? ""),
      recipientsRaw: String(formData.get("recipientsRaw") ?? ""),
    };

    try {
      const res = await fetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong creating that campaign.");
        return;
      }

      toast.success("Campaign created as a draft.");
      router.push(`/admin/campaigns/${data.id}`);
    } catch {
      toast.error("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" required maxLength={200} placeholder="Founding Cohort Outreach — Batch 2" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audience">Audience (optional)</Label>
          <Input id="audience" name="audience" maxLength={500} placeholder="Warm list — case study downloads" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject line</Label>
        <Input id="subject" name="subject" required maxLength={300} placeholder="Test it before you build it" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="previewText">Preview text (optional)</Label>
        <Input id="previewText" name="previewText" maxLength={300} placeholder="Shown after the subject line in most inboxes" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fromName">From name (optional)</Label>
          <Input id="fromName" name="fromName" maxLength={200} placeholder="Sam at WhatHits" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fromEmail">From email (optional)</Label>
          <Input id="fromEmail" name="fromEmail" type="email" placeholder="sam@whathits.co" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientsRaw">Recipients</Label>
        <Textarea
          id="recipientsRaw"
          name="recipientsRaw"
          required
          rows={8}
          placeholder={"One per line:\nJordan Reyes <jordan@northbeamstudio.co>, Northbeam Studio\nplain@email.com"}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          &quot;Name &lt;email&gt;, Company&quot; or just a bare email, one per line. Duplicate
          emails are merged automatically.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        This creates the campaign as a <span className="font-medium text-foreground">draft</span>{" "}
        with recipients marked pending — it doesn&apos;t actually send anything yet. Sending and
        open/click tracking connect once an email provider is wired up (see{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">docs/email-campaigns.md</code>).
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Create campaign
      </Button>
    </form>
  );
}
