"use client";

import { PortalMobileHeader } from "@/components/portal/nav-shell";
import { ADMIN_NAV } from "@/components/admin/sidebar";

export function AdminMobileHeader() {
  return <PortalMobileHeader items={ADMIN_NAV} />;
}
