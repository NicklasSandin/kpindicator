import { ALTERNATIVES, ALTERNATIVE_ROWS } from "@/content/alternatives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function AlternativesTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[220px] text-foreground">&nbsp;</TableHead>
            {ALTERNATIVES.map((alt) => (
              <TableHead
                key={alt.id}
                className={cn(
                  "min-w-[180px] text-foreground",
                  alt.featured && "bg-accent/50 text-accent-foreground",
                )}
              >
                <span className="font-semibold">{alt.name}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ALTERNATIVE_ROWS.map((row) => (
            <TableRow key={row.feature}>
              <TableCell className="align-top font-medium text-foreground">{row.feature}</TableCell>
              {ALTERNATIVES.map((alt) => (
                <TableCell
                  key={alt.id}
                  className={cn(
                    "align-top text-sm text-muted-foreground",
                    alt.featured && "bg-accent/30 font-medium text-foreground",
                  )}
                >
                  {row.values[alt.id]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
