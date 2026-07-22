"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, formatPercent, formatChange, getTrendDirection } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/ui/sparkline";
import {
  Search,
  Plus,
  X,
  ArrowUpDown,
  GripVertical,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SortMode = "custom" | "gainer" | "decliner" | "alpha" | "recent";

interface WatchlistStock {
  symbol: string;
  companyName: string;
  exchangeCode: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline?: number[];
  addedAt?: string;
}

const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ" },
  { symbol: "BRK.B", name: "Berkshire Hathaway", exchange: "NYSE" },
  { symbol: "UNH", name: "UnitedHealth Group", exchange: "NYSE" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE" },
  { symbol: "PG", name: "Procter & Gamble", exchange: "NYSE" },
  { symbol: "MA", name: "Mastercard Inc.", exchange: "NYSE" },
  { symbol: "HD", name: "Home Depot", exchange: "NYSE" },
  { symbol: "DIS", name: "Walt Disney Co.", exchange: "NYSE" },
  { symbol: "BAC", name: "Bank of America", exchange: "NYSE" },
  { symbol: "XOM", name: "Exxon Mobil", exchange: "NYSE" },
  { symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE" },
  { symbol: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corp.", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ" },
  { symbol: "CRM", name: "Salesforce Inc.", exchange: "NYSE" },
  { symbol: "COST", name: "Costco Wholesale", exchange: "NASDAQ" },
  { symbol: "BA", name: "Boeing Co.", exchange: "NYSE" },
  { symbol: "GS", name: "Goldman Sachs", exchange: "NYSE" },
  { symbol: "SQ", name: "Block Inc.", exchange: "NYSE" },
  { symbol: "SHOP", name: "Shopify Inc.", exchange: "TSX" },
  { symbol: "BABA", name: "Alibaba Group", exchange: "NYSE" },
  { symbol: "NIO", name: "NIO Inc.", exchange: "NYSE" },
  { symbol: "RIVN", name: "Rivian Automotive", exchange: "NASDAQ" },
  { symbol: "COIN", name: "Coinbase Global", exchange: "NASDAQ" },
  { symbol: "PLTR", name: "Palantir Technologies", exchange: "NYSE" },
  { symbol: "SNOW", name: "Snowflake Inc.", exchange: "NYSE" },
  { symbol: "UBER", name: "Uber Technologies", exchange: "NYSE" },
  { symbol: "ABNB", name: "Airbnb Inc.", exchange: "NASDAQ" },
  { symbol: "SPOT", name: "Spotify Technology", exchange: "NYSE" },
  { symbol: "SQSP", name: "Squarespace Inc.", exchange: "NYSE" },
  { symbol: "LMND", name: "Lemonade Inc.", exchange: "NYSE" },
];

export default function WatchlistPage() {
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlistName, setWatchlistName] = useState("My Watchlist");
  const [isEditing, setIsEditing] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist-local");
      const json = await res.json();
      setWatchlist(
        (json.data ?? []).map((s: any, i: number) => ({
          ...s,
          sparkline: generateSparkline(s.price, s.changePercent),
          addedAt: new Date(Date.now() - i * 86400000).toISOString(),
        }))
      );
    } catch {
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const generateSparkline = (base: number, trend: number): number[] => {
    const data: number[] = [];
    let current = base * (1 - trend * 0.02);
    for (let i = 0; i < 6; i++) {
      current += (trend * base * 0.005) + (Math.sin(i) * base * 0.005);
      data.push(Math.round(current * 100) / 100);
    }
    return data;
  };

  const addStock = async (symbol: string, name: string, exchange: string) => {
    setAdding(symbol);
    try {
      await fetch("/api/watchlist-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      setWatchlist((prev) => [
        {
          symbol,
          companyName: name,
          exchangeCode: exchange,
          price: 0,
          change: 0,
          changePercent: 0,
          sparkline: [0, 0, 0, 0, 0, 0],
          addedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setShowAddModal(false);
      setAddSearch("");
      fetchWatchlist();
    } finally {
      setAdding(null);
    }
  };

  const removeStock = async (symbol: string) => {
    await fetch("/api/watchlist-local", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const sorted = [...watchlist].sort((a, b) => {
    switch (sortMode) {
      case "gainer":
        return b.changePercent - a.changePercent;
      case "decliner":
        return a.changePercent - b.changePercent;
      case "alpha":
        return a.symbol.localeCompare(b.symbol);
      case "recent":
        return new Date(b.addedAt ?? 0).getTime() - new Date(a.addedAt ?? 0).getTime();
      default:
        return 0;
    }
  });

  const filtered = sorted.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdd = POPULAR_STOCKS.filter(
    (s) =>
      (s.symbol.toLowerCase().includes(addSearch.toLowerCase()) ||
        s.name.toLowerCase().includes(addSearch.toLowerCase())) &&
      !watchlist.some((w) => w.symbol === s.symbol)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <input
              type="text"
              value={watchlistName}
              onChange={(e) => setWatchlistName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
              autoFocus
              className="bg-surface-container-low border border-primary rounded-lg px-3 py-1 text-on-surface font-display font-bold text-xl focus:outline-none"
            />
          ) : (
            <h1
              className="font-display font-bold text-2xl text-on-surface italic cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsEditing(true)}
            >
              {watchlistName}
            </h1>
          )}
          <Badge>{watchlist.length} stocks</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Stock
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(
            [
              ["custom", "Custom"],
              ["gainer", "Top gainers"],
              ["decliner", "Top decliners"],
              ["alpha", "A-Z"],
              ["recent", "Recent"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-mono transition-all border",
                sortMode === mode
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h2 className="font-display font-bold text-lg text-on-surface">Add Stock</h2>
              <button
                onClick={() => { setShowAddModal(false); setAddSearch(""); }}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search by symbol or company name..."
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredAdd.slice(0, 20).map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => addStock(stock.symbol, stock.name, stock.exchange)}
                    disabled={adding === stock.symbol}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-high transition-colors text-left"
                  >
                    <div>
                      <span className="font-mono font-medium text-on-surface block">
                        {stock.symbol}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {stock.name} · {stock.exchange}
                      </span>
                    </div>
                    {adding === stock.symbol ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 text-on-surface-variant" />
                    )}
                  </button>
                ))}
                {filteredAdd.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-on-surface-variant text-sm">
                      {addSearch ? "No stocks found" : "All popular stocks are in your watchlist"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2.5 bg-surface-container border-b border-outline-variant text-on-surface-variant text-xs font-mono uppercase tracking-wider">
          <span className="col-span-1" />
          <span className="col-span-3">Symbol</span>
          <span className="col-span-2 text-right">Price</span>
          <span className="col-span-2 text-right">Change</span>
          <span className="col-span-2 text-right">% Change</span>
          <span className="col-span-1 text-right">Chart</span>
          <span className="col-span-1" />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
            <span className="text-on-surface-variant text-sm">Loading watchlist...</span>
          </div>
        )}

        {!loading && filtered.map((stock) => {
          const trend = getTrendDirection(stock.change);
          const trendColor =
            trend === "up"
              ? "text-primary"
              : trend === "down"
                ? "text-error"
                : "text-on-surface-variant";
          return (
            <div
              key={stock.symbol}
              className={cn(
                "grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-surface-container-high transition-colors group",
                "border-b border-outline-variant/50 last:border-b-0"
              )}
            >
              <div className="col-span-1 hidden md:flex items-center">
                <GripVertical className="w-4 h-4 text-on-surface-variant/30 group-hover:text-on-surface-variant cursor-grab" />
              </div>
              <div className="col-span-5 md:col-span-3">
                <a href={`/markets/${stock.symbol}`} className="block hover:text-primary transition-colors">
                  <span className="font-mono font-medium text-on-surface block">
                    {stock.symbol}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {stock.companyName} · {stock.exchangeCode}
                  </span>
                </a>
              </div>
              <div className="col-span-3 md:col-span-2 text-right">
                <span className="font-mono text-on-surface">
                  {stock.price > 0 ? formatPrice(stock.price) : "—"}
                </span>
              </div>
              <div className={cn("col-span-2 text-right font-mono text-sm", trendColor)}>
                {stock.price > 0 ? formatChange(stock.change) : "—"}
              </div>
              <div className={cn("col-span-2 text-right font-mono text-sm", trendColor)}>
                {stock.price > 0 ? formatPercent(stock.changePercent) : "—"}
              </div>
              <div className="col-span-1 hidden md:flex justify-end">
                {stock.sparkline && stock.price > 0 && (
                  <Sparkline
                    data={stock.sparkline}
                    positive={trend === "up"}
                    width={60}
                    height={24}
                  />
                )}
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-end">
                <button
                  onClick={() => removeStock(stock.symbol)}
                  className="p-1.5 text-on-surface-variant/30 hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                  aria-label={`Remove ${stock.symbol} from watchlist`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-on-surface-variant">
            {searchQuery
              ? "No stocks match your search"
              : "Your watchlist is empty — click Add Stock to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
