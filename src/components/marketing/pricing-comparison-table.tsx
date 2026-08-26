import { Check, Minus } from "lucide-react";

import { PACKAGES } from "@/content/packages";
import { COMPARISON_ROWS } from "@/content/comparison";
import { formatCents } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto size-4 text-primary" />
  ) : (
    <Minus className="mx-auto size-4 text-muted-foreground/40" />
  );
}

export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[260px] text-foreground">Feature</TableHead>
            {PACKAGES.map((pkg) => (
              <TableHead
                key={pkg.id}
                className={cn("text-center text-foreground", pkg.featured && "bg-accent/50")}
              >
                <div className="font-semibold">{pkg.name}</div>
                <div className="font-normal text-muted-foreground">{formatCents(pkg.priceCents)}</div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {COMPARISON_ROWS.map((row) => (
            <TableRow key={row.feature}>
              <TableCell className="font-medium text-foreground">{row.feature}</TableCell>
              {PACKAGES.map((pkg) => (
                <TableCell
                  key={pkg.id}
                  className={cn("text-center", pkg.featured && "bg-accent/30")}
                >
                  <Cell value={row.values[pkg.id]} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
