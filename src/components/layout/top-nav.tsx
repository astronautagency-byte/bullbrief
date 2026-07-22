"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Search, Bell, Menu, X } from "lucide-react";

interface TopNavProps {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function TopNav({ onMobileMenuToggle, mobileMenuOpen }: TopNavProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-surface-container-high/80 backdrop-blur-md",
        "border-b border-outline-variant z-50",
        "md:ml-64 md:w-[calc(100%-16rem)]",
        "w-full flex items-center justify-between px-4 md:px-6"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search stocks, news..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "w-full bg-surface-container-highest border rounded-lg",
              "pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50",
              "focus:outline-none transition-colors",
              searchFocused
                ? "border-primary ring-1 ring-primary/50"
                : "border-outline-variant"
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full border border-outline-variant bg-surface-container overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm font-medium">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
