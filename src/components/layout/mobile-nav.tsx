"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

const navItems = [
  { href: "/brief", label: "Brief", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: ListFilter },
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/podcasts", label: "Podcasts", icon: Podcast },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <nav
        className={cn(
          "absolute left-0 top-0 h-full w-72 bg-surface-container-low",
          "border-r border-outline-variant p-4",
          "transform transition-transform"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Link href="/brief" className="flex items-center gap-2" onClick={onClose}>
            <BrandLogo variant="horizontal" size="sm" />
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-primary"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-on-surface transition-colors"
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
