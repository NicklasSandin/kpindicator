"use client";

import { LayoutDashboard, Mail } from "lucide-react";

import { PortalSidebar, type PortalNavItem } from "@/components/portal/nav-shell";

export const ADMIN_NAV: PortalNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Email campaigns", icon: Mail },
];

export function AdminSidebar({ userName }: { userName: string }) {
  return <PortalSidebar items={ADMIN_NAV} userName={userName} userSubtitle="KPIndicator internal" />;
}
