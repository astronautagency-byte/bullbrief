"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import { MobileNav } from "./mobile-nav";
import { PrintBranding } from "./print-branding";
import { InstitutionBrandProvider } from "@/components/institution-brand-provider";
import { setDraftOwner } from "@/lib/privacy/transient-drafts";
import { seedDemoWorkspace } from "@/lib/demo-account";

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const pathname = usePathname();
  const [workspaceReady] = useState(() => {
    setDraftOwner(userEmail || null);
    seedDemoWorkspace(userEmail);
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  useEffect(()=>{const timer=setTimeout(()=>{try{setSidebarCollapsed(localStorage.getItem("bullbrief.sidebar-collapsed")==="1");}catch{/* Optional local preference. */}},0);return()=>clearTimeout(timer);},[]);
  function toggleSidebar(){const next=!sidebarCollapsed;setSidebarCollapsed(next);try{localStorage.setItem("bullbrief.sidebar-collapsed",next?"1":"0");}catch{/* The toggle still works without storage. */}}

  if (!workspaceReady) return <div className="min-h-screen bg-background" />;

  return (
    <InstitutionBrandProvider><div data-workspace-page={pathname.split("/")[1] || "cockpit"} data-sidebar-collapsed={sidebarCollapsed} className="institution-suite min-h-screen bg-background selection:bg-primary/20">
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar}/>
      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <TopNav
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <main className="workspace-main md:ml-60 pt-20 min-h-screen overflow-y-auto">
        <div className="workspace-content px-4 py-6 md:px-8 md:py-8 max-w-[1600px] mx-auto">
          <PrintBranding position="header" />
          <aside className="demo-data-notice" aria-label="Pilot data restrictions"><strong>Demo only</strong><span>Use fictional data. Real-client use has not been approved. Unsaved KYP drafts reset when this tab reloads. External AI is disabled by default.</span></aside>
          {children}
          <PrintBranding position="footer" />
        </div>
      </main>
    </div></InstitutionBrandProvider>
  );
}
