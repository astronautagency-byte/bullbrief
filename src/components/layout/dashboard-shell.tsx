"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";
import { PrintBranding } from "./print-branding";
import { InstitutionBrandProvider } from "@/components/institution-brand-provider";
import { seedDemoWorkspace } from "@/lib/demo-account";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const [workspaceReady] = useState(() => {
    seedDemoWorkspace(userEmail);
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!workspaceReady) return <div className="min-h-screen bg-background" />;

  return (
    <InstitutionBrandProvider><div className="min-h-screen bg-background selection:bg-primary/30">
      <Sidebar />
      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <TopNav
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <main className="md:ml-60 pt-24 min-h-screen overflow-y-auto">
        <div className="px-4 py-7 md:px-10 md:py-12 max-w-[1280px] mx-auto">
          <PrintBranding position="header" />
          {children}
          <PrintBranding position="footer" />
        </div>
      </main>
    </div></InstitutionBrandProvider>
  );
}
