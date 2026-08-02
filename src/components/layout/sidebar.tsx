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
        "w-60 fixed left-0 top-0 h-screen bg-background border-r border-outline-variant",
        "flex flex-col py-6 z-40",
        "hidden md:flex",
        className
      )}
    >
      <Link href="/brief" className="flex items-center gap-2 px-6 mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/BullBrief_Wordmark_Transparent.png"
          alt="BullBrief"
          className="h-7 w-auto dark:brightness-0 dark:invert"
        />
      </Link>

      <nav className="flex-1 px-4 space-y-1.5">
        {navItems.map((item) => {
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
