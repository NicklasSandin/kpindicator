"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INTERESTS = [
  { value: "call", label: "Book a validation call" },
  { value: "idea-check", label: "Idea Check — $995" },
  { value: "market-test", label: "Market Test — $2,500" },
  { value: "validation-sprint", label: "Validation Sprint — $4,900" },
  { value: "presale-sprint", label: "Presale Sprint — $8,500" },
  { value: "agency", label: "Agency / studio white-label" },
  { value: "other", label: "Something else" },
];

export function ContactForm() {
  const searchParams = useSearchParams();
  const defaultInterest = searchParams.get("interest") ?? "call";

  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [interest, setInterest] = React.useState(defaultInterest);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      interest,
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      form.reset();
    } catch {
      toast.error("Couldn't send that. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground">Got it.</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We read every message ourselves — expect a reply within one business day, usually
          faster.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Honeypot — hidden from real users, bots tend to fill every field. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required maxLength={200} placeholder="Jordan Reyes" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.com" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Company (optional)</Label>
          <Input id="company" name="company" maxLength={200} placeholder="Northbeam Studio" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interest">What are you interested in?</Label>
          <Select value={interest} onValueChange={setInterest}>
            <SelectTrigger id="interest" className="w-full">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              {INTERESTS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">What are you trying to figure out?</Label>
        <Textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={5}
          placeholder="We have 4 ideas for a vertical SaaS play and need to know which one to build first..."
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send message
      </Button>
    </form>
  );
}
