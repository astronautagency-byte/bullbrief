"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <TopNav
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <main className="md:ml-64 pt-24 min-h-screen overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
