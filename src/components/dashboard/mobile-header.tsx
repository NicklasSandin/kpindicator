"use client";

import { PortalMobileHeader } from "@/components/portal/nav-shell";
import { DASHBOARD_NAV } from "@/components/dashboard/sidebar";

export function DashboardMobileHeader() {
  return <PortalMobileHeader items={DASHBOARD_NAV} />;
}
