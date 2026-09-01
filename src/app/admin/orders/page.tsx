import type { Metadata } from "next";

import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { PACKAGES } from "@/content/packages";
import { formatCents, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: { absolute: "Orders — KPIndicator Admin" } };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ include: { organization: { include: { members: { include: { user: true } } } } }, orderBy: { createdAt: "desc" } });
  return <div className="mx-auto max-w-5xl">
    <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
    <p className="mt-1 text-sm text-muted-foreground">Verified Stripe orders and the organization that owns each purchase.</p>
    <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="p-4">Customer</th><th className="p-4">Package</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th></tr></thead>
        <tbody>{orders.map((order) => {
          const owner = order.organization.members.find((member) => member.role === "OWNER")?.user;
          const pkg = PACKAGES.find((item) => item.dbType === order.package);
          return <tr key={order.id} className="border-b border-border last:border-0"><td className="p-4"><p className="font-medium">{order.organization.name}</p><p className="text-xs text-muted-foreground">{owner?.email || "No owner email"}</p></td><td className="p-4"><Badge variant="secondary">{pkg?.name || order.package}</Badge></td><td className="p-4 font-medium">{formatCents(order.amountCents)}</td><td className="p-4"><StatusBadge status={order.status} /></td><td className="p-4 text-muted-foreground">{formatDate(order.createdAt)}</td></tr>;
        })}</tbody>
      </table>
      {orders.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No verified orders yet.</p>}
    </div>
  </div>;
}
