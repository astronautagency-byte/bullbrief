"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { StarRating } from "./star-rating";
import { MiniChart } from "@/components/ui/mini-chart";
import {
  Search,
  Plus,
  X,
  Loader2,
  ArrowRightLeft,
  AlertCircle,
} from "lucide-react";

interface StockData {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  starRating?: number;
  pe?: number;
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
  { symbol: "NFLX", name: "Netflix Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "DIS", name: "Walt Disney Co." },
  { symbol: "BA", name: "Boeing Co." },
  { symbol: "GS", name: "Goldman Sachs" },
];

export function StockComparison() {
  const [selected, setSelected] = useState<string[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [morningstarLoading, setMorningstarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const fetchYahooPrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return [];
    try {
      const res = await fetch(`/api/watchlist-local?symbols=${symbols.join(",")}`);
      const json = await res.json();
      return (json.data ?? []).map((d: any) => ({
        symbol: d.symbol,
        companyName: d.companyName || d.symbol,
        price: d.price ?? 0,
        change: d.change ?? 0,
        changePercent: d.changePercent ?? 0,
      }));
    } catch {
      return [];
    }
  }, []);

  const fetchMorningstarData = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return {};
    try {
      const res = await fetch(`/api/picks/compare?symbols=${symbols.join(",")}`);
      const json = await res.json();
      const map: Record<string, { starRating?: number; pe?: number }> = {};
      for (const d of json.data ?? []) {
        if (d.symbol && !d.error) {
          map[d.symbol] = {
            starRating: d.starRating,
            pe: d.pe,
          };
        }
      }
      return map;
    } catch {
      return {};
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (selected.length < 2) {
      setStocks([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Step 1: Get Yahoo prices immediately
    const yahooData = await fetchYahooPrices(selected);
    if (yahooData.length > 0) {
      setStocks(yahooData);
      setLoading(false);
    }

    // Step 2: Try Morningstar in background for extra data
    setMorningstarLoading(true);
    const msData = await fetchMorningstarData(selected);
    setMorningstarLoading(false);

    // Step 3: Merge Morningstar data into existing stock data
    if (Object.keys(msData).length > 0) {
      setStocks((prev) =>
        prev.map((s) => ({
          ...s,
          starRating: msData[s.symbol]?.starRating ?? s.starRating,
          pe: msData[s.symbol]?.pe ?? s.pe,
        }))
      );
    }
  }, [selected, fetchYahooPrices, fetchMorningstarData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      {loading && selected.length >= 2 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
          <span className="text-on-surface-variant text-sm">Fetching prices...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/30 text-sm text-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && stocks.length >= 2 && (
        <div className="relative">
          {morningstarLoading && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-on-surface-variant z-10">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading ratings...
            </div>
          )}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-6 gap-px bg-outline-variant/30">
              <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant col-span-2">
                Stock
              </div>
              <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant text-right">
                Price
              </div>
              <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant text-right">
                Change
              </div>
              <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant text-center">
                Rating
              </div>
              <div className="bg-surface-container px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant text-right">
                P/E
              </div>
            </div>

            {/* Stock rows */}
            {stocks.map((stock) => {
              const positive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  className="grid grid-cols-6 gap-px bg-outline-variant/30 border-b border-outline-variant/50 last:border-b-0"
                >
                  {/* Stock name + chart */}
                  <div className="bg-surface-container-low px-4 py-3 col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <a href={`/markets/${stock.symbol}`} className="hover:text-primary transition-colors">
                        <span className="font-mono font-bold text-on-surface text-sm">{stock.symbol}</span>
                      </a>
                      <button
                        onClick={() => removeSymbol(stock.symbol)}
                        className="text-on-surface-variant/20 hover:text-error transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[10px] text-on-surface-variant block mb-1.5">{stock.companyName}</span>
                    <MiniChart
                      symbol={stock.symbol}
                      positive={positive}
                      width={120}
                      height={30}
                    />
                  </div>

                  {/* Price */}
                  <div className="bg-surface-container-low px-4 py-3 flex items-center justify-end">
                    <span className="font-mono text-on-surface font-medium text-sm">
                      ${stock.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Change */}
                  <div className="bg-surface-container-low px-4 py-3 flex items-center justify-end">
                    <span className={cn(
                      "font-mono text-xs px-2 py-0.5 rounded",
                      positive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                    )}>
                      {positive ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                    </span>
                  </div>

                  {/* Star Rating */}
                  <div className="bg-surface-container-low px-4 py-3 flex items-center justify-center">
                    {stock.starRating ? (
                      <StarRating rating={stock.starRating} size="sm" />
                    ) : morningstarLoading ? (
                      <Loader2 className="w-3 h-3 text-on-surface-variant/30 animate-spin" />
                    ) : (
                      <span className="text-on-surface-variant/30 text-xs">—</span>
                    )}
                  </div>

                  {/* P/E */}
                  <div className="bg-surface-container-low px-4 py-3 flex items-center justify-end">
                    {stock.pe ? (
                      <span className="font-mono text-xs text-on-surface-variant">{stock.pe.toFixed(1)}</span>
                    ) : morningstarLoading ? (
                      <Loader2 className="w-3 h-3 text-on-surface-variant/30 animate-spin" />
                    ) : (
                      <span className="text-on-surface-variant/30 text-xs">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
