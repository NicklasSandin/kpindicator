import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewCampaignForm } from "@/components/admin/new-campaign-form";

export const metadata: Metadata = { title: { absolute: "New campaign — WhatHits Admin" } };

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        All campaigns
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-foreground">New email campaign</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set up a campaign and its recipient list. You can send it however you currently send
        email — this just gives you a place to track what happens after.
      </p>

      <div className="mt-8">
        <NewCampaignForm />
      </div>
    </div>
  );
}
