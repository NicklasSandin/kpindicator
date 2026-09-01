"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function InquiryStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(status);
  async function update(next: string) {
    const previous = value;
    setValue(next);
    const response = await fetch(`/api/admin/inquiries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (!response.ok) { setValue(previous); toast.error("Could not update inquiry status."); return; }
    toast.success("Inquiry status updated.");
    router.refresh();
  }
  return <select aria-label="Inquiry status" value={value} onChange={(event) => update(event.target.value)} className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium">
    <option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="QUALIFIED">Qualified</option><option value="CLOSED">Closed</option>
  </select>;
}
