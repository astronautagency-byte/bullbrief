"use client";
import { useEffect, useState } from "react";
import { KypWorkspace } from "./kyp-workspace";
import { KypHoldingsSimulation } from "./kyp-holdings-simulation";
import { KypReviewWizard } from "./kyp-review-wizard";
export function KypHome() {
  const [view, setView] = useState<"review" | "holdings" | "simulation">("review");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "simulation") {
      const timer = window.setTimeout(() => setView("simulation"), 0);
      return () => window.clearTimeout(timer);
    }
    if (!new URLSearchParams(window.location.search).has("product")) return;
    const timer = window.setTimeout(() => setView("holdings"), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <div className="space-y-6"><header className="workspace-page-header flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant pb-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-primary">Product oversight / Due diligence</p><h1 className="mt-3">KYP Product Watchlist</h1><p className="mt-2 text-sm text-on-surface-variant">Research, evidence and review records for the products in your practice.</p></div><span className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-[10px] text-on-surface-variant">Advisor review workspace</span></header><nav aria-label="KYP workspace" className="mb-6 flex flex-wrap gap-2">{([['simulation', 'Holdings simulation'], ['review', 'Guided review'], ['holdings', 'Holdings & existing documents']] as const).map(([id, label]) => <button key={id} onClick={() => setView(id)} aria-pressed={view === id} className={`ui-button rounded-full border px-4 py-2.5 text-xs font-semibold ${view === id ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-on-surface-variant"}`}>{label}</button>)}</nav>{view === "simulation" ? <KypHoldingsSimulation onOpenHolding={(id) => { const url = new URL(window.location.href); url.searchParams.delete("view"); url.searchParams.set("product", id); window.history.replaceState({}, "", url); setView("holdings"); }} /> : view === "review" ? <KypReviewWizard /> : <KypWorkspace />}</div>;
}
