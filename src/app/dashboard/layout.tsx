import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardMobileHeader } from "@/components/dashboard/mobile-header";
import { getCurrentUser } from "@/lib/current-user";

// The dashboard reads live rows from the database on every request — it
// must never be statically prerendered, or clients would see whatever data
// existed at build time forever.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1">
      <DashboardSidebar userName={user.name} userCompany={user.company} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardMobileHeader />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
