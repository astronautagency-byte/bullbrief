"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { Menu, X, LogOut } from "lucide-react";
import { NotificationPanel } from "@/components/notification-panel";
import { TickerStrip } from "@/components/ui/ticker-strip";
import Link from "next/link";

interface TopNavProps {
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export function TopNav({ onMobileMenuToggle, mobileMenuOpen }: TopNavProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-[80]",
        "md:ml-60 md:w-[calc(100%-15rem)]",
        "w-full"
      )}
    >
      <div className="relative z-20 bg-background/90 backdrop-blur-xl border-b border-outline-variant">
        <div className="h-16 flex items-center justify-between px-4 md:px-10">
          <div className="flex items-center gap-2">
            <Link href="/brief" className="md:hidden flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/BullBrief_Logo_Mark_Transparent.png"
                alt="BullBrief"
                className="h-8 w-8 dark:brightness-0 dark:invert"
              />
            </Link>
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-2 text-on-surface-variant hover:text-primary transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationPanel />
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full border border-outline-variant bg-surface-container-low overflow-hidden hover:bg-surface-container transition-colors"
              >
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm font-medium">
                  U
                </div>
              </button>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-low rounded-3xl border border-outline-variant z-50 overflow-hidden p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-full text-sm text-error hover:bg-surface-container transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticker Strip */}
      <div className="relative z-10">
        <TickerStrip />
      </div>
    </header>
  );
}
