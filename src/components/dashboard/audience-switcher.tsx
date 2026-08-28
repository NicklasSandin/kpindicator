"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Rocket, TrendingUp, Compass, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Audience = "STARTUP" | "INVESTOR" | "EXPLORER";

const OPTIONS: { value: Audience; icon: typeof Rocket; label: string }[] = [
  { value: "STARTUP", icon: Rocket, label: "Startup founder" },
  { value: "INVESTOR", icon: TrendingUp, label: "Investor" },
  { value: "EXPLORER", icon: Compass, label: "Private person, just exploring" },
];

/**
 * Lets a signed-in user change their persona at any time, not just once
 * during onboarding. Admins skip the onboarding redirect entirely (see
 * getCurrentUser()), so this is their only way to set an audience at all.
 */
export function AudienceSwitcher({ initialAudience }: { initialAudience: Audience | null }) {
  const router = useRouter();
  const [value, setValue] = React.useState<Audience | undefined>(initialAudience ?? undefined);
  const [saving, setSaving] = React.useState(false);

  async function handleChange(next: string) {
    const audience = next as Audience;
    setSaving(true);
    try {
      const res = await fetch("/api/auth/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update — try again.");
        return;
      }

      setValue(audience);
      toast.success("Updated who you're viewing as.");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Viewing as</span>
      <Select value={value} onValueChange={handleChange} disabled={saving}>
        <SelectTrigger className="w-[220px]" size="sm">
          <SelectValue placeholder="Set who you are" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <option.icon className="size-4 text-muted-foreground" />
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
    </div>
  );
}
