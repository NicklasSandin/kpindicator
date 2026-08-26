import { Check, X } from "lucide-react";

import { FOR_YOU, NOT_FOR_YOU } from "@/content/audience";

export function WhoItsFor() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Check className="size-5 text-status-go-foreground" />
          Who it&apos;s for
        </h3>
        <ul className="mt-5 space-y-5">
          {FOR_YOU.map((item) => (
            <li key={item.title}>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <X className="size-5 text-status-nogo-foreground" />
          Who it&apos;s not for
        </h3>
        <ul className="mt-5 space-y-5">
          {NOT_FOR_YOU.map((item) => (
            <li key={item.title}>
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
