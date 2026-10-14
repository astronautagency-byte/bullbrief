"use client";

import { cn } from "@/lib/cn";
import Link from "next/link";
import {
  LayoutDashboard,
  ListFilter,
  TrendingUp,
  Newspaper,
  Podcast,
  Bookmark,
  Settings,
  Target,
  X,
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
  { href: "/settings", label: "Settings", icon: Settings, moduleId: null },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const workspaceModules = useWorkspaceModules();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <nav
        className={cn(
          "absolute left-0 top-0 h-full w-72 bg-background",
          "border-r border-outline-variant p-6",
          "transform transition-transform"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <BrandLockup compact onClick={onClose} />
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-primary"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          {navItems.filter((item) => item.moduleId === null || workspaceModules.includes(item.moduleId as WorkspaceModuleId)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-full text-on-surface-variant font-medium hover:bg-surface-container-low hover:text-on-surface transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
