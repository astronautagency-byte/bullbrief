"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Newspaper,
  Bookmark,
  Target,
  Settings,
  ListFilter,
  TrendingUp,
  Podcast,
  ClipboardCheck,
} from "lucide-react";
import { useWorkspaceModules, type WorkspaceModuleId } from "@/lib/workspace-modules";
import { BrandLockup } from "@/components/layout/brand-lockup";

const navItems = [
  { href: "/brief", label: "Advisor Desktop", icon: LayoutDashboard, moduleId: null },
  { href: "/watchlist", label: "Client Portfolios", icon: ListFilter, moduleId: "watchlist" },
  { href: "/kyp", label: "KYP Reviews", icon: ClipboardCheck, moduleId: "kyp" },
  { href: "/picks", label: "Security Research", icon: Target, moduleId: "picks" },
  { href: "/markets", label: "Markets", icon: TrendingUp, moduleId: "markets" },
  { href: "/news", label: "Client Briefings", icon: Newspaper, moduleId: "news" },
  { href: "/podcasts", label: "Market Audio", icon: Podcast, moduleId: "podcasts" },
  { href: "/saved", label: "Saved Research", icon: Bookmark, moduleId: "saved" },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const workspaceModules = useWorkspaceModules();
  const visibleItems = navItems.filter((item) => item.moduleId === null || workspaceModules.includes(item.moduleId as WorkspaceModuleId));

  return (
    <aside
      className={cn(
        "w-60 fixed left-0 top-0 h-screen bg-background border-r border-outline-variant",
        "flex flex-col py-6 z-40",
        "hidden md:flex",
        className
      )}
    >
      <BrandLockup className="mx-6 mb-8" />

      <nav className="flex-1 px-4 space-y-1.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-full text-[15px] font-medium transition-colors",
                "hover:bg-surface-container-low hover:text-on-surface",
                isActive
                  ? "text-on-primary font-semibold bg-primary"
                  : "text-on-surface-variant"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pt-5 border-t border-outline-variant space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-full font-medium transition-colors",
                "hover:bg-surface-container-low",
                isActive
                  ? "text-on-primary font-semibold bg-primary"
                  : "text-on-surface-variant"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
