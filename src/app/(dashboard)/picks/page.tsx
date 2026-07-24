"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PageHead } from "@/components/page-head";
import { StockComparison } from "@/components/picks/stock-comparison";
import { StockScreener } from "@/components/picks/stock-screener";
import { ArrowRightLeft, Search, Sparkles } from "lucide-react";

type PicksTab = "compare" | "screener";

export default function PicksPage() {
  const [tab, setTab] = useState<PicksTab>("compare");

  return (
    <div className="space-y-6">
      <PageHead
        title="Bull Picks"
        description="Compare stocks side by side, screen by Morningstar ratings, P/E ratios, and more. Powered by Morningstar data."
        canonical="https://bullbrief.vercel.app/picks"
      />

      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface italic">
          Bull Picks
        </h1>
        <p className="text-on-surface-variant text-xs md:text-sm mt-1">
          Stock comparison and screening powered by Morningstar
        </p>
      </div>

      <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-lg p-1">
        {([
          ["compare", "Compare", ArrowRightLeft],
          ["screener", "Screener", Search],
        ] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              tab === t
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "compare" && <StockComparison />}
      {tab === "screener" && <StockScreener />}
    </div>
  );
}
