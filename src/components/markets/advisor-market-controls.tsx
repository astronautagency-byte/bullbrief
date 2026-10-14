"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, CircleAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

type MarketIndex = {
  symbol: string;
  name: string;
  value: number;
  changePercent: number;
};

type AdvisorMarketControlsProps = {
  indexes: MarketIndex[];
};

const checks = [
  { id: "market", label: "Market triggers", detail: "Material moves, concentration, liquidity, suitability", href: "/watchlist" },
  { id: "kyc", label: "KYC exceptions", detail: "Reviews due, material changes, outstanding contact", href: "/watchlist" },
  { id: "kyp", label: "KYP exceptions", detail: "New, transferred or materially changed securities", href: "/kyp" },
  { id: "conflicts", label: "Conflict review", detail: "Material conflicts and client-interest response", href: "/kyp" },
  { id: "orders", label: "Client-directed trades", detail: "Instructions, concerns and escalation record", href: "/saved" },
  { id: "records", label: "Documentation", detail: "Rationale, alternatives, costs, evidence, follow-up", href: "/saved" },
] as const;

function localDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function AdvisorMarketControls({ indexes }: AdvisorMarketControlsProps) {
  const storageKey = `bullbrief:advisor-controls:${localDateKey()}`;
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (Array.isArray(saved)) setCompleted(saved.filter((item): item is string => typeof item === "string"));
      } catch {
        setCompleted([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const toggle = (id: string) => {
    setCompleted((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const exceptions = useMemo(
    () => indexes.filter((index) => Math.abs(index.changePercent) >= 2),
    [indexes]
  );
  const volatility = indexes.find((index) => index.symbol === "^VIX");
  const progress = Math.round((completed.length / checks.length) * 100);

  return (
    <section aria-labelledby="advisor-controls-heading" className="grid gap-4 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Market exceptions</p>
            <h2 id="advisor-controls-heading" className="mt-1 font-display text-2xl font-semibold text-on-surface">Needs review</h2>
          </div>
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", exceptions.length ? "bg-error/10 text-error" : "bg-primary/10 text-primary")}>
            {exceptions.length ? <CircleAlert className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </span>
        </div>
        <div className="mt-5 space-y-3">
          <a href="/watchlist" className="group flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <div><p className="text-sm font-semibold text-on-surface">Benchmark moves</p><p className="mt-0.5 text-xs text-on-surface-variant">{exceptions.length ? `${exceptions.length} benchmark${exceptions.length === 1 ? "" : "s"} moved 2% or more` : "No benchmark move above 2%"}</p></div>
            <ArrowUpRight className="h-4 w-4 text-on-surface-variant group-hover:text-primary" />
          </a>
          <a href="/watchlist" className="group flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <div><p className="text-sm font-semibold text-on-surface">Volatility check</p><p className="mt-0.5 text-xs text-on-surface-variant">{volatility ? `VIX ${volatility.value.toFixed(2)}, ${volatility.changePercent >= 0 ? "+" : ""}${volatility.changePercent.toFixed(2)}% today` : "Volatility data unavailable for this view"}</p></div>
            <ArrowUpRight className="h-4 w-4 text-on-surface-variant group-hover:text-primary" />
          </a>
          <a href="/kyp" className="group flex items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-3.5">
            <div><p className="text-sm font-semibold text-on-surface">Product change review</p><p className="mt-0.5 text-xs text-on-surface-variant">Open KYP records and material change checks</p></div>
            <ArrowUpRight className="h-4 w-4 text-on-surface-variant group-hover:text-primary" />
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Daily controls</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-on-surface">Daily review log</h2>
          </div>
          <div className="text-right"><p className="font-mono text-sm font-semibold text-on-surface">{completed.length}/{checks.length}</p><p className="text-[10px] text-on-surface-variant">{progress}% complete</p></div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {checks.map((item) => {
            const isDone = completed.includes(item.id);
            return (
              <div key={item.id} className={cn("flex gap-3 rounded-xl border p-3 transition-colors", isDone ? "border-primary/25 bg-primary/5" : "border-outline-variant bg-surface-container-low")}>
                <button type="button" onClick={() => toggle(item.id)} aria-label={`${isDone ? "Mark incomplete" : "Mark complete"}: ${item.label}`} aria-pressed={isDone} className={cn("mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border", isDone ? "border-primary bg-primary text-on-primary" : "border-outline text-transparent")}><Check className="h-3 w-3" /></button>
                <div className="min-w-0 flex-1"><a href={item.href} className="text-xs font-semibold text-on-surface hover:text-primary">{item.label}</a><p className="mt-1 text-[11px] leading-4 text-on-surface-variant">{item.detail}</p></div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 flex items-start gap-2 border-t border-outline-variant pt-3 text-[10px] leading-4 text-on-surface-variant"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" />Use with dealer supervisory, approval and recordkeeping procedures.</p>
      </div>
    </section>
  );
}
