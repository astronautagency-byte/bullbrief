"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { MiniChart } from "@/components/ui/mini-chart";
import {
  Search,
  Plus,
  X,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";

interface ComparisonData {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  recentPrices: number[];
  error?: string;
}

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corp." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "NVDA", name: "NVIDIA Corp." },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "JPM", name: "JPMorgan Chase" },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "JNJ", name: "Johnson & Johnson" },
  { symbol: "WMT", name: "Walmart Inc." },
  { symbol: "UNH", name: "UnitedHealth Group" },
  { symbol: "HD", name: "Home Depot" },
  { symbol: "BAC", name: "Bank of America" },
  { symbol: "XOM", name: "Exxon Mobil" },
  { symbol: "PFE", name: "Pfizer Inc." },
  { symbol: "CRM", name: "Salesforce Inc." },
  { symbol: "COST", name: "Costco Wholesale" },
  { symbol: "COIN", name: "Coinbase Global" },
  { symbol: "PLTR", name: "Palantir Technologies" },
  { symbol: "UBER", name: "Uber Technologies" },
  { symbol: "SHOP", name: "Shopify Inc." },
  { symbol: "TD", name: "Toronto-Dominion Bank" },
  { symbol: "RY", name: "Royal Bank of Canada" },
  { symbol: "ENB", name: "Enbridge Inc." },
];

export function StockComparison() {
  const [selected, setSelected] = useState<string[]>([]);
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const fetchComparison = useCallback(async () => {
    if (selected.length < 2) { setData([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/picks/compare?symbols=${selected.join(",")}`);
      const json = await res.json();
      setData(json.data ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const addSymbol = (sym: string) => {
    if (!selected.includes(sym) && selected.length < 4) {
      setSelected([...selected, sym.toUpperCase()]);
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const removeSymbol = (sym: string) => {
    setSelected(selected.filter((s) => s !== sym));
  };

  const filtered = POPULAR_STOCKS.filter(
    (s) =>
      !selected.includes(s.symbol) &&
      (s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {selected.map((sym) => (
          <div
            key={sym}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm"
          >
            <span className="font-mono font-medium text-primary">{sym}</span>
            <button
              onClick={() => removeSymbol(sym)}
              className="text-primary/50 hover:text-primary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {selected.length < 4 && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all text-sm"
          >
            <Plus className="w-3 h-3" />
            Add stock
          </button>
        )}
      </div>

      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
            {filtered.slice(0, 10).map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => addSymbol(stock.symbol)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-low transition-colors text-left"
              >
                <div>
                  <span className="font-mono font-medium text-on-surface text-sm">{stock.symbol}</span>
                  <span className="text-xs text-on-surface-variant ml-2">{stock.name}</span>
                </div>
                <Plus className="w-4 h-4 text-on-surface-variant" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length < 2 && (
        <div className="text-center py-8">
          <ArrowRightLeft className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
          <p className="text-on-surface-variant text-sm">
            Select at least 2 stocks to compare
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
          <span className="text-on-surface-variant text-sm">Loading comparison data...</span>
        </div>
      )}

      {!loading && data.length >= 2 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-px bg-outline-variant/30">
            <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Metric
            </div>
            {data.map((d) => (
              <div
                key={d.symbol}
                className="bg-surface-container px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-on-surface">{d.symbol}</span>
                  <button
                    onClick={() => removeSymbol(d.symbol)}
                    className="text-on-surface-variant/30 hover:text-error transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Price row */}
          <div className="grid grid-cols-4 gap-px bg-outline-variant/30">
            <div className="bg-surface-container-low px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Price
            </div>
            {data.map((d) => (
              <div key={d.symbol} className="bg-surface-container-low px-4 py-3">
                <span className="font-mono text-on-surface font-medium">
                  {d.price ? `$${d.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Change row */}
          <div className="grid grid-cols-4 gap-px bg-outline-variant/30">
            <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              Change
            </div>
            {data.map((d) => {
              const positive = (d.change ?? 0) >= 0;
              return (
                <div key={d.symbol} className="bg-surface-container px-4 py-3">
                  <span className={cn("font-mono text-sm", positive ? "text-primary" : "text-error")}>
                    {d.change != null ? `${d.change >= 0 ? "+" : ""}${d.change.toFixed(2)}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* % Change row */}
          <div className="grid grid-cols-4 gap-px bg-outline-variant/30">
            <div className="bg-surface-container-low px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              % Change
            </div>
            {data.map((d) => {
              const positive = (d.changePercent ?? 0) >= 0;
              return (
                <div key={d.symbol} className="bg-surface-container-low px-4 py-3">
                  <span className={cn("font-mono text-sm", positive ? "text-primary" : "text-error")}>
                    {d.changePercent != null ? `${d.changePercent >= 0 ? "+" : ""}${d.changePercent.toFixed(2)}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chart row */}
          <div className="grid grid-cols-4 gap-px bg-outline-variant/30">
            <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              30D Chart
            </div>
            {data.map((d) => {
              const positive = (d.changePercent ?? 0) >= 0;
              return (
                <div key={d.symbol} className="bg-surface-container px-4 py-3 flex justify-center">
                  {d.recentPrices && d.recentPrices.length > 1 ? (
                    <MiniChart
                      symbol={d.symbol}
                      positive={positive}
                      width={140}
                      height={50}
                    />
                  ) : (
                    <span className="text-on-surface-variant text-xs">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
