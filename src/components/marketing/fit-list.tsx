import {
  TrendingUp,
  Layers,
  Rocket,
  Globe,
  BadgeCheck,
  Building2,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  layers: Layers,
  rocket: Rocket,
  globe: Globe,
  "badge-check": BadgeCheck,
  "building-2": Building2,
  briefcase: Briefcase,
};

export interface FitItem {
  title: string;
  detail: string;
  icon: string;
}

export function FitList({ items }: { items: readonly FitItem[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li key={item.title} className="flex gap-3">
            {Icon && (
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4.5" />
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
  );
}
