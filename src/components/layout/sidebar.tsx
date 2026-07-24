"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  BarChart3,
  Newspaper,
  Mic,
  Bookmark,
  Target,
  Settings,
  ListFilter,
  TrendingUp,
  Podcast,
} from "lucide-react";

const navItems = [
  { href: "/brief", label: "Brief", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: ListFilter },
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/picks", label: "Bull Picks", icon: Target },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/podcasts", label: "Podcasts", icon: Podcast },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-64 fixed left-0 top-0 h-screen bg-surface-container-low border-r border-outline-variant",
        "flex flex-col py-4 z-40",
        "hidden md:flex",
        className
      )}
    >
      <Link href="/brief" className="flex items-center gap-2 px-5 mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/BullBrief_Wordmark_Transparent.png"
          alt="BullBrief"
          className="h-6 w-auto"
        />
      </Link>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all",
                "hover:bg-surface-container-high",
                "active:scale-95 duration-100",
                isActive
                  ? "text-primary font-bold bg-primary/10 border-r-4 border-primary"
                  : "text-on-surface-variant"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all",
                "hover:bg-surface-container-high",
                isActive
                  ? "text-primary font-bold bg-primary/10"
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
