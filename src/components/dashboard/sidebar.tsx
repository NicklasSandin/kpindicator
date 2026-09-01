"use client";

import { FileText, LayoutDashboard, FolderKanban, Users } from "lucide-react";

import { PortalSidebar, type PortalNavItem } from "@/components/portal/nav-shell";

export const DASHBOARD_NAV: PortalNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/team", label: "Team", icon: Users },
];

export function DashboardSidebar({
  userName,
  userCompany,
}: {
  userName: string;
  userCompany: string | null;
}) {
  return <PortalSidebar items={DASHBOARD_NAV} userName={userName} userSubtitle={userCompany} />;
}
