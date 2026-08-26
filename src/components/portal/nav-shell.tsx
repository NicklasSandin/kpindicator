"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, type LucideIcon } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Shared shell for the two internal portals (client /dashboard and internal
 * /admin) — same sidebar/mobile-nav chrome, different nav items and footer
 * link. Keeps both portals visually consistent without duplicating the
 * Sheet wiring twice.
 */
export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

function isActive(pathname: string, item: PortalNavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function NavLink({ item, active }: { item: PortalNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      <item.icon className="size-4" />
      {item.label}
    </Link>
  );
}

export function PortalSidebar({
  items,
  userName,
  userSubtitle,
  backHref = "/",
  backLabel = "Back to website",
}: {
  items: PortalNavItem[];
  userName: string;
  userSubtitle?: string | null;
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item)} />
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href={backHref}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <div className="mt-2 flex items-center justify-between rounded-md px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            {userSubtitle && (
              <p className="truncate text-xs text-muted-foreground">{userSubtitle}</p>
            )}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}

export function PortalMobileHeader({
  items,
  backHref = "/",
  backLabel = "Back to website",
}: {
  items: PortalNavItem[];
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80vw] max-w-xs">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-3">
              {items.map((item) => (
                <SheetClose asChild key={item.href}>
                  <NavLink item={item} active={isActive(pathname, item)} />
                </SheetClose>
              ))}
            </nav>
            <div className="mt-4 px-3">
              <SheetClose asChild>
                <Link
                  href={backHref}
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {backLabel}
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
