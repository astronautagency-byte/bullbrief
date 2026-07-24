"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, formatPercent, formatChange, getTrendDirection } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { MiniChart } from "@/components/ui/mini-chart";
import { PageHead } from "@/components/page-head";
import {
  Search,
  Plus,
  X,
  GripVertical,
  Download,
  Trash2,
  Loader2,
  Bell,
  BellRing,
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

interface PriceAlertItem {
  id: string;
  symbol: string;
  companyName: string;
  type: "above" | "below";
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  createdAt: string;
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

  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [showAlertModal, setShowAlertModal] = useState<WatchlistStock | null>(null);
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertSaving, setAlertSaving] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("bullbrief_watchlist");
      const symbols: string[] = stored ? JSON.parse(stored) : [];

      if (symbols.length === 0) {
        setWatchlist([]);
        return;
      }

      const meta: Record<string, { name: string; exchange: string }> = {
        AAPL: { name: "Apple Inc.", exchange: "NASDAQ" },
        MSFT: { name: "Microsoft Corp.", exchange: "NASDAQ" },
        GOOGL: { name: "Alphabet Inc.", exchange: "NASDAQ" },
        AMZN: { name: "Amazon.com Inc.", exchange: "NASDAQ" },
        NVDA: { name: "NVIDIA Corp.", exchange: "NASDAQ" },
        META: { name: "Meta Platforms", exchange: "NASDAQ" },
        TSLA: { name: "Tesla Inc.", exchange: "NASDAQ" },
        NFLX: { name: "Netflix Inc.", exchange: "NASDAQ" },
        AMD: { name: "Advanced Micro Devices", exchange: "NASDAQ" },
        INTC: { name: "Intel Corp.", exchange: "NASDAQ" },
        JPM: { name: "JPMorgan Chase", exchange: "NYSE" },
        V: { name: "Visa Inc.", exchange: "NYSE" },
        JNJ: { name: "Johnson & Johnson", exchange: "NYSE" },
        WMT: { name: "Walmart Inc.", exchange: "NYSE" },
        UNH: { name: "UnitedHealth Group", exchange: "NYSE" },
        XOM: { name: "Exxon Mobil", exchange: "NYSE" },
        "BRK.B": { name: "Berkshire Hathaway", exchange: "NYSE" },
        PG: { name: "Procter & Gamble", exchange: "NYSE" },
        MA: { name: "Mastercard Inc.", exchange: "NYSE" },
        HD: { name: "Home Depot", exchange: "NYSE" },
        DIS: { name: "Walt Disney Co.", exchange: "NYSE" },
        BAC: { name: "Bank of America", exchange: "NYSE" },
        PFE: { name: "Pfizer Inc.", exchange: "NYSE" },
        CRM: { name: "Salesforce Inc.", exchange: "NYSE" },
        COST: { name: "Costco Wholesale", exchange: "NASDAQ" },
        COIN: { name: "Coinbase Global", exchange: "NASDAQ" },
        PLTR: { name: "Palantir Technologies", exchange: "NYSE" },
        UBER: { name: "Uber Technologies", exchange: "NYSE" },
        ABNB: { name: "Airbnb Inc.", exchange: "NASDAQ" },
        SHOP: { name: "Shopify Inc.", exchange: "TSX" },
        BABA: { name: "Alibaba Group", exchange: "NYSE" },
        SQ: { name: "Block Inc.", exchange: "NYSE" },
        TD: { name: "Toronto-Dominion Bank", exchange: "TSX" },
        RY: { name: "Royal Bank of Canada", exchange: "TSX" },
        BNS: { name: "Bank of Nova Scotia", exchange: "TSX" },
        BMO: { name: "Bank of Montreal", exchange: "TSX" },
        ENB: { name: "Enbridge Inc.", exchange: "TSX" },
        CNR: { name: "Canadian National Railway", exchange: "TSX" },
        SU: { name: "Suncor Energy", exchange: "TSX" },
        CNQ: { name: "Canadian Natural Resources", exchange: "TSX" },
        BAM: { name: "Brookfield Asset Management", exchange: "TSX" },
        L: { name: "Loblaw Companies", exchange: "TSX" },
        ATD: { name: "Alimentation Couche-Tard", exchange: "TSX" },
        T: { name: "BCE Inc.", exchange: "TSX" },
        DOL: { name: "Dollarama Inc.", exchange: "TSX" },
        CSU: { name: "Constellation Software", exchange: "TSX" },
        BB: { name: "BlackBerry Ltd.", exchange: "TSX" },
      };

      const res = await fetch(`/api/watchlist-local?symbols=${symbols.join(",")}`);
      const json = await res.json();
      const priceData: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const s of json.data ?? []) {
        priceData[s.symbol] = { price: s.price, change: s.change, changePercent: s.changePercent };
      }

      setWatchlist(
        symbols.map((sym, i) => ({
          symbol: sym,
          companyName: meta[sym]?.name ?? sym,
          exchangeCode: meta[sym]?.exchange ?? "NASDAQ",
          price: priceData[sym]?.price ?? 0,
          change: priceData[sym]?.change ?? 0,
          changePercent: priceData[sym]?.changePercent ?? 0,
          sparkline: generateSparkline(priceData[sym]?.price ?? 0, priceData[sym]?.changePercent ?? 0),
          addedAt: new Date(Date.now() - i * 86400000).toISOString(),
        }))
      );
    } catch {
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const stored = localStorage.getItem("bullbrief_watchlist");
      const symbols: string[] = stored ? JSON.parse(stored) : [];
      if (symbols.length === 0) return;

      const res = await fetch(`/api/watchlist-local?symbols=${symbols.join(",")}`);
      const json = await res.json();
      const priceData: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const s of json.data ?? []) {
        priceData[s.symbol] = { price: s.price, change: s.change, changePercent: s.changePercent };
      }

      setWatchlist((prev) =>
        prev.map((item) => {
          const p = priceData[item.symbol];
          if (!p) return item;
          return { ...item, price: p.price, change: p.change, changePercent: p.changePercent };
        })
      );
    } catch {}
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      const json = await res.json();
      setAlerts(json.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchWatchlist();
    fetchAlerts();
    const priceInterval = setInterval(refreshPrices, 3000);
    const alertInterval = setInterval(fetchAlerts, 30000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(alertInterval);
    };
  }, [fetchWatchlist, refreshPrices, fetchAlerts]);

  const generateSparkline = (base: number, trend: number): number[] => {
    if (base === 0) return [0, 0, 0, 0, 0, 0];
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
      const stored = localStorage.getItem("bullbrief_watchlist");
      const symbols: string[] = stored ? JSON.parse(stored) : [];
      if (!symbols.includes(symbol)) {
        symbols.push(symbol);
        localStorage.setItem("bullbrief_watchlist", JSON.stringify(symbols));
      }
      setShowAddModal(false);
      setAddSearch("");
      fetchWatchlist();
    } finally {
      setAdding(null);
    }
  };

  const removeStock = async (symbol: string) => {
    const stored = localStorage.getItem("bullbrief_watchlist");
    const symbols: string[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem("bullbrief_watchlist", JSON.stringify(symbols.filter((s) => s !== symbol)));
    setWatchlist((prev) => prev.filter((s) => s.symbol !== symbol));
  };

  const createAlert = async () => {
    if (!showAlertModal || !alertPrice) return;
    setAlertSaving(true);
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: showAlertModal.symbol,
          companyName: showAlertModal.companyName,
          type: alertType,
          targetPrice: Number(alertPrice),
        }),
      });
      fetchAlerts();
      setShowAlertModal(null);
      setAlertPrice("");
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } finally {
      setAlertSaving(false);
    }
  };

  const deleteAlert = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
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

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHead
        title="Watchlist"
        description="Track your favorite stocks with real-time prices, charts, and price alerts. Build and manage your personalized stock watchlist."
        canonical="https://bullbrief.vercel.app/watchlist"
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <input
              type="text"
              value={watchlistName}
              onChange={(e) => setWatchlistName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
              autoFocus
              className="bg-surface-container-low border border-primary rounded-lg px-3 py-1 text-on-surface font-display font-bold text-lg focus:outline-none"
            />
          ) : (
            <h1
              className="font-display font-bold text-xl md:text-2xl text-on-surface italic cursor-pointer hover:text-primary transition-colors"
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
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Stock
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search watchlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
                "px-3 py-1.5 rounded-full text-xs font-mono transition-all border whitespace-nowrap",
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

      {triggeredAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <BellRing className="w-4 h-4 text-primary" />
            Triggered Alerts
          </h3>
          {triggeredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/30"
            >
              <div className="flex items-center gap-3">
                <BellRing className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-mono font-medium text-on-surface text-sm">
                    {alert.symbol}
                  </span>
                  <span className="text-on-surface-variant text-xs ml-2">
                    {alert.type === "above" ? "rose above" : "dropped below"}{" "}
                    ${alert.targetPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="p-1 text-on-surface-variant/50 hover:text-error transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-md shadow-2xl">
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

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h2 className="font-display font-bold text-lg text-on-surface">
                Set Alert — {showAlertModal.symbol}
              </h2>
              <button
                onClick={() => { setShowAlertModal(null); setAlertPrice(""); }}
                className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-on-surface-variant text-sm">
                Current price: {showAlertModal.price > 0 ? formatPrice(showAlertModal.price) : "N/A"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["above", "below"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAlertType(t)}
                    className={cn(
                      "px-4 py-2.5 rounded-lg text-sm font-medium transition-all border",
                      alertType === t
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:border-primary/30"
                    )}
                  >
                    {t === "above" ? "Price Goes Above" : "Price Drops Below"}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-on-surface-variant text-xs font-mono uppercase tracking-wider mb-1.5">
                  Target Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <Button
                className="w-full"
                onClick={createAlert}
                disabled={!alertPrice || alertSaving}
                loading={alertSaving}
              >
                <Bell className="w-4 h-4" />
                Create Alert
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeAlerts.length > 0 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant text-xs"
              >
                <span className="font-mono font-medium text-on-surface">{alert.symbol}</span>
                <span className="text-on-surface-variant">
                  {alert.type === "above" ? "↑" : "↓"} ${alert.targetPrice.toFixed(2)}
                </span>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-on-surface-variant/50 hover:text-error transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
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
              className="border-b border-outline-variant/50 last:border-b-0 hover:bg-surface-container-high transition-colors group"
            >
              <div className="md:grid md:grid-cols-12 md:gap-2 md:px-5 md:py-3 md:items-center flex flex-col p-3 gap-2">
                <div className="hidden md:flex md:col-span-1 items-center">
                  <GripVertical className="w-4 h-4 text-on-surface-variant/30 group-hover:text-on-surface-variant cursor-grab" />
                </div>
                <div className="md:col-span-3">
                  <a href={`/markets/${stock.symbol}`} className="block hover:text-primary transition-colors">
                    <span className="font-mono font-medium text-on-surface block">
                      {stock.symbol}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {stock.companyName} · {stock.exchangeCode}
                    </span>
                  </a>
                </div>
                <div className="md:col-span-2 md:text-right">
                  <span className="text-xs text-on-surface-variant md:hidden mr-2">Price:</span>
                  <span className="font-mono text-on-surface">
                    {stock.price > 0 ? formatPrice(stock.price) : "—"}
                  </span>
                </div>
                <div className={cn("md:col-span-2 md:text-right font-mono text-sm", trendColor)}>
                  <span className="text-xs text-on-surface-variant md:hidden mr-2">Change:</span>
                  {stock.price > 0 ? formatChange(stock.change) : "—"}
                </div>
                <div className={cn("md:col-span-2 md:text-right font-mono text-sm", trendColor)}>
                  <span className="text-xs text-on-surface-variant md:hidden mr-2">%</span>
                  {stock.price > 0 ? formatPercent(stock.changePercent) : "—"}
                </div>
                <div className="hidden md:flex md:col-span-1 justify-end">
                  {stock.price > 0 && (
                    <MiniChart
                      symbol={stock.symbol}
                      positive={trend === "up"}
                    />
                  )}
                </div>
                <div className="md:col-span-1 flex justify-end gap-1">
                  <button
                    onClick={() => {
                      setShowAlertModal(stock);
                      setAlertPrice(stock.price > 0 ? String(Math.round(stock.price)) : "");
                    }}
                    className="p-1.5 text-on-surface-variant/30 hover:text-primary transition-colors"
                    aria-label={`Set price alert for ${stock.symbol}`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeStock(stock.symbol)}
                    className="p-1.5 text-on-surface-variant/30 hover:text-error transition-all"
                    aria-label={`Remove ${stock.symbol} from watchlist`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
