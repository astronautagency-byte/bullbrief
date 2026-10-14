"use client";

import { useState } from "react";
import { Check, Clipboard, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type WatchlistResponse = {
  data?: Array<{ isDefault?: boolean; items?: Array<{ symbol?: string }> }>;
};

export function AdvisorActionBrief() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    setCopied(false);
    try {
      let symbols: string[] = [];
      const watchlistResponse = await fetch("/api/watchlists", { cache: "no-store" });
      if (watchlistResponse.ok) {
        const payload = await watchlistResponse.json() as WatchlistResponse;
        const selected = payload.data?.find((watchlist) => watchlist.isDefault) ?? payload.data?.[0];
        symbols = (selected?.items ?? []).flatMap((item) => item.symbol ? [item.symbol] : []);
      }
      if (!symbols.length) {
        try {
          symbols = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");
        } catch {
          symbols = [];
        }
      }

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Create an advisor action brief for today. Include only verified market and news facts from the supplied context. Identify which supplied portfolio symbols may warrant review, but only when there is direct evidence. Then provide three client conversation points. Finish with a short compliance follow-up using these exact categories: KYC means client information such as circumstances, objectives, time horizon, risk tolerance and risk capacity. KYP means product information such as structure, features, risks, costs, liquidity, approval and material changes. Also cover suitability triggers, concentration, liquidity, costs, reasonable alternatives, conflicts and documentation. State what portfolio or client information is unavailable. Do not recommend buying, selling or holding.",
          watchlist: symbols,
        }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.reply !== "string") throw new Error("Brief unavailable");
      setBrief(payload.reply);
      localStorage.setItem("bullbrief:last-advisor-action-brief", JSON.stringify({ createdAt: new Date().toISOString(), text: payload.reply }));
    } catch {
      setBrief("The action brief could not be generated. Refresh market data and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!brief) return;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section aria-labelledby="action-brief-heading" className="overflow-hidden rounded-2xl border border-primary/25" style={{ backgroundImage: "linear-gradient(135deg, rgb(var(--brand-primary-rgb, 75 226 119) / 0.10), rgb(var(--brand-primary-rgb, 75 226 119) / 0.02) 45%, transparent)" }}>
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:p-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary"><Sparkles className="h-4 w-4" />Signal to record</div>
          <h2 id="action-brief-heading" className="mt-2 font-display text-2xl font-semibold text-on-surface">Advisor action brief</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">Current market context, portfolio exceptions, client talking points and the review record in one pass.</p>
          <button type="button" onClick={generate} disabled={loading} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-on-primary transition-opacity disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {brief ? "Refresh brief" : "Build action brief"}
          </button>
        </div>
        <div className={cn("relative min-h-44 rounded-xl border p-4", brief ? "border-outline-variant bg-background/85" : "border-dashed border-outline-variant bg-surface-container-low/60")}>
          {brief ? (
            <>
              <button type="button" onClick={copy} className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1.5 text-[10px] font-semibold text-on-surface-variant hover:text-on-surface">
                {copied ? <Check className="h-3 w-3 text-primary" /> : <Clipboard className="h-3 w-3" />}{copied ? "Copied" : "Copy"}
              </button>
              <p className="whitespace-pre-wrap pr-16 text-xs leading-6 text-on-surface">{brief}</p>
            </>
          ) : (
            <div className="grid min-h-36 place-items-center text-center"><div><p className="text-sm font-semibold text-on-surface">No brief generated</p><p className="mt-1 max-w-md text-xs leading-5 text-on-surface-variant">Build from current market data, news and available portfolio symbols.</p></div></div>
          )}
        </div>
      </div>
    </section>
  );
}
