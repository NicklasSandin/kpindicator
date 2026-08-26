import type { ReactNode } from "react";
import type { Metadata } from "next";

import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminMobileHeader } from "@/components/admin/mobile-header";
import { getCurrentAdmin } from "@/lib/current-admin";

// Live data, same reasoning as the client dashboard layout — never
// statically prerender an internal ops view.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Next doesn't apply a layout's title.template to its directly-adjacent
  // leaf page (no intermediate nesting between them), and a plain string
  // title still gets wrapped by the ROOT layout's template regardless — so
  // every admin page below sets title.absolute to fully opt out and control
  // its own title verbatim.
  title: { absolute: "KPIndicator Admin" },
  // Keep this out of search results and off the public sitemap — it's not
  // linked from the marketing site or the client dashboard on purpose.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();

  return (
    <div className="flex min-h-full flex-1">
      <AdminSidebar userName={admin.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileHeader />
        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
