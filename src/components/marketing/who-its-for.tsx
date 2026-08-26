import { Check, X, Rocket, Layers, Building2, Handshake, History, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FOR_YOU, NOT_FOR_YOU } from "@/content/audience";

const FOR_YOU_ICONS: LucideIcon[] = [Rocket, Layers, Building2, Handshake, History];
const NOT_FOR_YOU_ICONS: LucideIcon[] = [Ban, Ban, Ban, Ban];

export function WhoItsFor() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Check className="size-5 text-status-go-foreground" />
          Who it&apos;s for
        </h3>
        <ul className="mt-5 space-y-5">
          {FOR_YOU.map((item, i) => {
            const Icon = FOR_YOU_ICONS[i];
            return (
              <li key={item.title} className="flex gap-3">
                {Icon && (
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-status-go text-status-go-foreground">
                    <Icon className="size-4" />
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <X className="size-5 text-status-nogo-foreground" />
          Who it&apos;s not for
        </h3>
        <ul className="mt-5 space-y-5">
          {NOT_FOR_YOU.map((item, i) => {
            const Icon = NOT_FOR_YOU_ICONS[i];
            return (
              <li key={item.title} className="flex gap-3">
                {Icon && (
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-status-nogo text-status-nogo-foreground">
                    <Icon className="size-4" />
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
