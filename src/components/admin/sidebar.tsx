"use client";

import { CreditCard, Inbox, LayoutDashboard, Mail, Workflow } from "lucide-react";

import { PortalSidebar, type PortalNavItem } from "@/components/portal/nav-shell";

export const ADMIN_NAV: PortalNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Email campaigns", icon: Mail },
  { href: "/admin/inquiries", label: "Idea reviews", icon: Inbox },
  { href: "/admin/orders", label: "Orders", icon: CreditCard },
  { href: "/admin/explainer", label: "How it works", icon: Workflow },
];

export function AdminSidebar({ userName }: { userName: string }) {
  return <PortalSidebar items={ADMIN_NAV} userName={userName} userSubtitle="KPIndicator internal" />;
}
