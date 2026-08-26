"use client";

import * as React from "react";
import type { EmailRecipient } from "@prisma/client";
import { Search } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

const ENGAGEMENT_RANK: Record<string, number> = {
  CLICKED: 0,
  OPENED: 1,
  DELIVERED: 2,
  SENT: 3,
  PENDING: 4,
  BOUNCED: 5,
  COMPLAINED: 5,
  UNSUBSCRIBED: 5,
  FAILED: 5,
};

export function RecipientTable({ recipients }: { recipients: EmailRecipient[] }) {
  const [query, setQuery] = React.useState("");

  const sorted = React.useMemo(
    () =>
      [...recipients].sort((a, b) => {
        const rankDiff = (ENGAGEMENT_RANK[a.status] ?? 9) - (ENGAGEMENT_RANK[b.status] ?? 9);
        if (rankDiff !== 0) return rankDiff;
        const aTime = a.lastOpenedAt?.getTime() ?? a.sentAt?.getTime() ?? 0;
        const bTime = b.lastOpenedAt?.getTime() ?? b.sentAt?.getTime() ?? 0;
        return bTime - aTime;
      }),
    [recipients],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((r) =>
      [r.name, r.email, r.company].filter(Boolean).some((v) => v!.toLowerCase().includes(q)),
    );
  }, [sorted, query]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or company..."
          className="pl-9"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Clicked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{r.name ?? r.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.email}
                    {r.company ? ` · ${r.company}` : ""}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.sentAt ? formatDate(r.sentAt) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.openCount > 0 ? (
                    <>
                      {r.openCount}x · last {formatDate(r.lastOpenedAt!)}
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.clickCount > 0 ? (
                    <>
                      {r.clickCount}x · last {formatDate(r.lastClickedAt!)}
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No recipients match &quot;{query}&quot;.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
