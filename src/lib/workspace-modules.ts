"use client";

import { useEffect, useState } from "react";

export const WORKSPACE_MODULES = [
  { id: "watchlist", label: "Portfolio monitor", description: "Monitor client holdings, pricing and material moves." },
  { id: "markets", label: "Market monitor", description: "Track Canadian and U.S. markets, rates and volatility." },
  { id: "picks", label: "Trade research", description: "Compare securities and document reasonable alternatives." },
  { id: "kyp", label: "KYP queue", description: "Complete product reviews and maintain advisor records." },
  { id: "news", label: "Client news", description: "Review stories relevant to client conversations." },
  { id: "podcasts", label: "Market audio", description: "Follow selected market and economic commentary." },
  { id: "saved", label: "Research library", description: "Return to saved analysis and client-ready material." },
] as const;

export type WorkspaceModuleId = (typeof WORKSPACE_MODULES)[number]["id"];
export const DEFAULT_WORKSPACE_MODULES: WorkspaceModuleId[] = WORKSPACE_MODULES.map((module) => module.id);
export const WORKSPACE_MODULES_KEY = "bullbrief:workspace-modules:v1";

function validModules(value: unknown): WorkspaceModuleId[] | null {
  if (!Array.isArray(value)) return null;
  const allowed = new Set<string>(DEFAULT_WORKSPACE_MODULES);
  return value.filter((item): item is WorkspaceModuleId => typeof item === "string" && allowed.has(item));
}

export function saveWorkspaceModules(modules: WorkspaceModuleId[]) {
  localStorage.setItem(WORKSPACE_MODULES_KEY, JSON.stringify(modules));
  window.dispatchEvent(new CustomEvent("bullbrief:workspace-modules", { detail: modules }));
}

export function useWorkspaceModules() {
  const [modules, setModules] = useState<WorkspaceModuleId[]>(DEFAULT_WORKSPACE_MODULES);

  useEffect(() => {
    const load = async () => {
      try {
        const local = validModules(JSON.parse(localStorage.getItem(WORKSPACE_MODULES_KEY) || "null"));
        if (local) setModules(local);
      } catch {}
      try {
        const response = await fetch("/api/preferences");
        if (response.ok) {
          const stored = validModules((await response.json()).data?.workspaceModules);
          if (stored) {
            setModules(stored);
            localStorage.setItem(WORKSPACE_MODULES_KEY, JSON.stringify(stored));
          }
        }
      } catch {}
    };
    const timer = window.setTimeout(() => void load(), 0);
    const handleUpdate = (event: Event) => {
      const next = validModules((event as CustomEvent<unknown>).detail);
      if (next) setModules(next);
    };
    window.addEventListener("bullbrief:workspace-modules", handleUpdate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bullbrief:workspace-modules", handleUpdate);
    };
  }, []);

  return modules;
}
