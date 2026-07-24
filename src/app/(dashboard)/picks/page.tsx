"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PageHead } from "@/components/page-head";
import { ComparisonTable } from "@/components/picks/comparison-table";
import { StockScreener } from "@/components/picks/stock-screener";
import { ArrowRightLeft, Search, BarChart3, TrendingUp } from "lucide-react";

type PicksTab = "compare" | "screener";
type AssetType = "stock" | "fund";

export default function PicksPage() {
  const [tab, setTab] = useState<PicksTab>("compare");
  const [assetType, setAssetType] = useState<AssetType>("stock");

  return (
    <div className="space-y-6">
      <PageHead
        title="Bull Picks"
        description="Compare stocks and funds side by side, screen by Morningstar ratings, P/E ratios, and more. Powered by Morningstar data."
        canonical="https://bullbrief.vercel.app/picks"
      />

      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface italic">
          Bull Picks
        </h1>
        <p className="text-on-surface-variant text-xs md:text-sm mt-1">
          Comparison and screening powered by Morningstar
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-lg p-1 print:hidden">
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

      {/* Compare tab content */}
      {tab === "compare" && (
        <>
          {/* Asset type toggle + sub-tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
            {/* Asset type toggle */}
            <div className="flex items-center gap-1 bg-surface-container border border-outline-variant rounded-lg p-0.5">
              {([
                ["stock", "Stocks", TrendingUp],
                ["fund", "Funds/ETFs", BarChart3],
              ] as const).map(([t, label, Icon]) => (
                <button
                  key={t}
                  onClick={() => setAssetType(t)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    assetType === t
                      ? "bg-surface-container-high text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Sub-tabs (Morningstar style) */}
            <div className="flex items-center gap-1 text-xs">
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/30">
                Comparables
              </span>
            </div>
          </div>

          <ComparisonTable assetType={assetType} onAssetTypeChange={setAssetType} />
        </>
      )}

      {tab === "screener" && <StockScreener />}
    </div>
  );
}
