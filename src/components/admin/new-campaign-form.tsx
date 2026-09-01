"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";

export function NewCampaignForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [templateKey, setTemplateKey] = React.useState<string>(EMAIL_TEMPLATES[0].key);
  const [subject, setSubject] = React.useState<string>(EMAIL_TEMPLATES[0].subject);
  const [bodyText, setBodyText] = React.useState<string>(EMAIL_TEMPLATES[0].bodyText);
  const [recipientsRaw, setRecipientsRaw] = React.useState("");

  function chooseTemplate(key: string) {
    const template = EMAIL_TEMPLATES.find((item) => item.key === key);
    if (!template) return;
    setTemplateKey(template.key);
    setSubject(template.subject);
    setBodyText(template.bodyText);
  }

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
      templateKey,
      bodyText,
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

      toast.success(
        data.suppressedCount
          ? `Campaign created. ${data.suppressedCount} suppressed recipient(s) were excluded.`
          : "Campaign created as a draft.",
      );
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
        <Label htmlFor="template">Starter template</Label>
        <select id="template" value={templateKey} onChange={(event) => chooseTemplate(event.target.value)} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
          {EMAIL_TEMPLATES.map((template) => <option key={template.key} value={template.key}>{template.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject line</Label>
        <Input id="subject" name="subject" required maxLength={300} value={subject} onChange={(event) => setSubject(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bodyText">Plain-text message</Label>
        <Textarea id="bodyText" name="bodyText" required maxLength={30000} rows={12} value={bodyText} onChange={(event) => setBodyText(event.target.value)} className="font-mono text-sm" />
        <p className="text-xs text-muted-foreground">
          Available fields: {"{{firstName}}"}, {"{{company}}"}, {"{{idea}}"}, and {"{{senderName}}"}. Review every message before sending.
        </p>
        <details className="rounded-lg border border-border p-3 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">Two suggested follow-ups</summary>
          <div className="mt-3 space-y-3 text-muted-foreground">
            {EMAIL_TEMPLATES.find((item) => item.key === templateKey)?.followUps.map((followUp, index) => (
              <div key={followUp} className="rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-foreground">Follow-up {index + 1}</p>
                <p className="mt-1 whitespace-pre-wrap">{followUp}</p>
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setBodyText(followUp)}>Use as message</Button>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="space-y-2">
        <Label htmlFor="previewText">Preview text (optional)</Label>
        <Input id="previewText" name="previewText" maxLength={300} placeholder="Shown after the subject line in most inboxes" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fromName">From name (optional)</Label>
          <Input id="fromName" name="fromName" maxLength={200} placeholder="Sam at KPIndicator" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fromEmail">From email (optional)</Label>
          <Input id="fromEmail" name="fromEmail" type="email" placeholder="sam@kpindicator.co" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="recipientsRaw">Recipients</Label>
          <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
            Import CSV or text
            <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 50_000) { toast.error("Recipient files must be smaller than 50 KB."); return; }
              setRecipientsRaw(await file.text());
            }} />
          </label>
        </div>
        <Textarea
          id="recipientsRaw"
          name="recipientsRaw"
          required
          value={recipientsRaw}
          onChange={(event) => setRecipientsRaw(event.target.value)}
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
        This creates a <span className="font-medium text-foreground">draft</span>. Globally
        suppressed addresses are excluded automatically. You can preview and explicitly start
        the send from the campaign page after reviewing the copy and recipient list.
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Create campaign
      </Button>
    </form>
  );
}
