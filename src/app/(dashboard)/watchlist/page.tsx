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
  Grid2X2,
  List,
  Pencil,
  WalletCards,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { legacySymbolsMissingFromAccount } from "@/lib/watchlist-sync";

type SortMode = "custom" | "gainer" | "decliner" | "alpha" | "recent";

interface WatchlistStock {
  itemId: string;
  watchlistId: string;
  symbol: string;
  companyName: string;
  exchangeCode: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  quantity: number | null;
  averageCost: number | null;
  householdLabel: string | null;
  positionAsOf: string | null;
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
  { symbol: "SHOP.TO", name: "Shopify Inc.", exchange: "TSX" },
  { symbol: "RY.TO", name: "Royal Bank of Canada", exchange: "TSX" },
  { symbol: "TD.TO", name: "Toronto-Dominion Bank", exchange: "TSX" },
  { symbol: "BMO.TO", name: "Bank of Montreal", exchange: "TSX" },
  { symbol: "BNS.TO", name: "Bank of Nova Scotia", exchange: "TSX" },
  { symbol: "ENB.TO", name: "Enbridge Inc.", exchange: "TSX" },
  { symbol: "CNR.TO", name: "Canadian National Railway", exchange: "TSX" },
  { symbol: "SU.TO", name: "Suncor Energy", exchange: "TSX" },
  { symbol: "CNQ.TO", name: "Canadian Natural Resources", exchange: "TSX" },
  { symbol: "BAM.TO", name: "Brookfield Asset Management", exchange: "TSX" },
  { symbol: "DOL.TO", name: "Dollarama Inc.", exchange: "TSX" },
  { symbol: "CSU.TO", name: "Constellation Software", exchange: "TSX" },
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
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<"account" | "local">("account");
  const [watchlistView, setWatchlistView] = useState<"list" | "grid">("list");
  const [showPositionModal, setShowPositionModal] = useState<WatchlistStock | null>(null);
  const [positionQuantity, setPositionQuantity] = useState("");
  const [positionAverageCost, setPositionAverageCost] = useState("");
  const [positionHousehold, setPositionHousehold] = useState("");
  const [positionCurrency, setPositionCurrency] = useState("CAD");
  const [positionSaving, setPositionSaving] = useState(false);
  const [positionError, setPositionError] = useState("");

  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [showAlertModal, setShowAlertModal] = useState<WatchlistStock | null>(null);
  const [alertType, setAlertType] = useState<"above" | "below">("above");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertSaving, setAlertSaving] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
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

      const watchlistsResponse = await fetch("/api/watchlists", { cache: "no-store" });
      if (!watchlistsResponse.ok) {
        throw new Error(watchlistsResponse.status === 401 ? "Sign in to sync your watchlist" : "Watchlist sync unavailable");
      }
      const watchlistsJson = await watchlistsResponse.json();
      let serverWatchlist = (watchlistsJson.data ?? []).find((item: { isDefault: boolean }) => item.isDefault)
        ?? watchlistsJson.data?.[0];

      if (!serverWatchlist) {
        const createResponse = await fetch("/api/watchlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My Watchlist" }),
        });
        if (!createResponse.ok) throw new Error("Could not create account watchlist");
        const created = await createResponse.json();
        serverWatchlist = { ...created.data, items: [] };
      }

      const legacySymbols: string[] = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");
      const missingLegacy = legacySymbolsMissingFromAccount(
        (serverWatchlist.items ?? []).map((item: { symbol: string }) => item.symbol),
        legacySymbols
      );
      let legacyMigrationComplete = true;
      if (missingLegacy.length) {
        const migrationResponses = await Promise.all(
          missingLegacy.map((symbol) =>
            fetch(`/api/watchlists/${serverWatchlist.id}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                symbol,
                companyName: meta[symbol]?.name ?? symbol,
                exchangeCode: meta[symbol]?.exchange ?? null,
              }),
            })
          )
        );
        legacyMigrationComplete = migrationResponses.every((response) => response.ok);
        if (!legacyMigrationComplete) throw new Error("Legacy watchlist migration did not complete");
        const refreshed = await fetch("/api/watchlists", { cache: "no-store" });
        if (!refreshed.ok) throw new Error("Could not verify migrated watchlist");
        const refreshedJson = await refreshed.json();
        serverWatchlist = (refreshedJson.data ?? []).find((item: { id: string }) => item.id === serverWatchlist.id) ?? serverWatchlist;
      }
      if (legacySymbols.length && legacyMigrationComplete) localStorage.removeItem("bullbrief_watchlist");

      setActiveWatchlistId(serverWatchlist.id);
      setWatchlistName(serverWatchlist.name || "Client portfolio");
      setStorageMode("account");
      const items: Array<{ id: string; symbol: string; companyName: string | null; exchangeCode: string | null; quantity: string | number | null; averageCost: string | number | null; householdLabel: string | null; currency: string | null; positionAsOf: string | null; addedAt: string }> =
        serverWatchlist.items ?? [];
      const symbols = items.map((item) => item.symbol);
      if (!symbols.length) {
        setWatchlist([]);
        return;
      }

      const res = await fetch(`/api/watchlist-local?symbols=${symbols.join(",")}`);
      const json = await res.json();
      const priceData: Record<string, { price: number; change: number; changePercent: number; currency?: string | null }> = {};
      for (const s of json.data ?? []) {
        priceData[s.symbol] = { price: s.price, change: s.change, changePercent: s.changePercent, currency: s.currency };
      }

      setWatchlist(
        items.map((item) => ({
          itemId: item.id,
          watchlistId: serverWatchlist.id,
          symbol: item.symbol,
          companyName: item.companyName ?? meta[item.symbol]?.name ?? item.symbol,
          exchangeCode: item.exchangeCode ?? meta[item.symbol]?.exchange ?? "Unknown",
          price: priceData[item.symbol]?.price ?? 0,
          change: priceData[item.symbol]?.change ?? 0,
          changePercent: priceData[item.symbol]?.changePercent ?? 0,
          currency: item.currency ?? priceData[item.symbol]?.currency ?? (item.symbol.endsWith(".TO") ? "CAD" : "USD"),
          quantity: item.quantity === null ? null : Number(item.quantity),
          averageCost: item.averageCost === null ? null : Number(item.averageCost),
          householdLabel: item.householdLabel,
          positionAsOf: item.positionAsOf,
          addedAt: item.addedAt,
        }))
      );
    } catch (reason) {
      console.error(reason);
      const symbols: string[] = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");
      setActiveWatchlistId("local");
      setStorageMode("local");
      if (!symbols.length) {
        setWatchlist([]);
      } else {
        try {
          const quoteResponse = await fetch(`/api/watchlist-local?symbols=${encodeURIComponent(symbols.join(","))}`);
          const quoteJson = await quoteResponse.json();
          const quotes = new Map<string, { companyName?: string; exchangeCode?: string; price?: number; change?: number; changePercent?: number }>(
            (quoteJson.data ?? []).map((quote: { symbol: string }) => [quote.symbol, quote])
          );
          setWatchlist(symbols.map((symbol) => {
            const stock = POPULAR_STOCKS.find((item) => item.symbol === symbol);
            const quote = quotes.get(symbol);
            return {
              itemId: `local-${symbol}`,
              watchlistId: "local",
              symbol,
              companyName: quote?.companyName ?? stock?.name ?? symbol,
              exchangeCode: quote?.exchangeCode ?? stock?.exchange ?? "Unknown",
              price: quote?.price ?? 0,
              change: quote?.change ?? 0,
              changePercent: quote?.changePercent ?? 0,
              currency: symbol.endsWith(".TO") ? "CAD" : "USD",
              quantity: null,
              averageCost: null,
              householdLabel: null,
              positionAsOf: null,
            };
          }));
        } catch {
          setWatchlist([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const symbols = watchlist.map((item) => item.symbol);
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
  }, [watchlist]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      const json = await res.json();
      setAlerts(json.data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void fetchWatchlist();
      void fetchAlerts();
      const storedView = localStorage.getItem("bullbrief_watchlist_view");
      if (storedView === "list" || storedView === "grid") setWatchlistView(storedView);
    }, 0);
    const alertInterval = setInterval(fetchAlerts, 30000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(alertInterval);
    };
  }, [fetchWatchlist, fetchAlerts]);

  const selectWatchlistView = (view: "list" | "grid") => {
    setWatchlistView(view);
    localStorage.setItem("bullbrief_watchlist_view", view);
  };

  useEffect(() => {
    const priceInterval = window.setInterval(() => void refreshPrices(), 30000);
    return () => window.clearInterval(priceInterval);
  }, [refreshPrices]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") void fetchWatchlist();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [fetchWatchlist]);

  const addStock = async (symbol: string) => {
    if (!activeWatchlistId) return;
    setAdding(symbol);
    try {
      const stock = POPULAR_STOCKS.find((item) => item.symbol === symbol);
      if (activeWatchlistId === "local") {
        const current: string[] = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");
        localStorage.setItem("bullbrief_watchlist", JSON.stringify([...new Set([...current, symbol])]));
        setShowAddModal(false);
        setAddSearch("");
        await fetchWatchlist();
        return;
      }
      const response = await fetch(`/api/watchlists/${activeWatchlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          companyName: stock?.name ?? symbol,
          exchangeCode: stock?.exchange ?? null,
        }),
      });
      if (!response.ok) {
        if (response.status >= 500) {
          const current: string[] = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");
          localStorage.setItem("bullbrief_watchlist", JSON.stringify([...new Set([...current, symbol])]));
          setActiveWatchlistId("local");
          setStorageMode("local");
        } else {
          throw new Error("Could not add stock");
        }
      }
      setShowAddModal(false);
      setAddSearch("");
      await fetchWatchlist();
    } finally {
      setAdding(null);
    }
  };

  const removeStock = async (stock: WatchlistStock) => {
    if (stock.watchlistId === "local") {
      const current: string[] = JSON.parse(localStorage.getItem("bullbrief_watchlist") || "[]");
      localStorage.setItem("bullbrief_watchlist", JSON.stringify(current.filter((symbol) => symbol !== stock.symbol)));
      setWatchlist((prev) => prev.filter((item) => item.symbol !== stock.symbol));
      return;
    }
    const response = await fetch(
      `/api/watchlists/${stock.watchlistId}/items?itemId=${encodeURIComponent(stock.itemId)}`,
      { method: "DELETE" }
    );
    if (!response.ok) return;
    setWatchlist((prev) => prev.filter((item) => item.itemId !== stock.itemId));
  };

  const openPositionEditor = (stock: WatchlistStock) => {
    setShowPositionModal(stock);
    setPositionQuantity(stock.quantity === null ? "" : String(stock.quantity));
    setPositionAverageCost(stock.averageCost === null ? "" : String(stock.averageCost));
    setPositionHousehold(stock.householdLabel ?? "");
    setPositionCurrency(stock.currency || (stock.symbol.endsWith(".TO") ? "CAD" : "USD"));
    setPositionError("");
  };

  const savePosition = async () => {
    if (!showPositionModal || showPositionModal.watchlistId === "local") return;
    const quantity = Number(positionQuantity);
    const averageCost = positionAverageCost === "" ? null : Number(positionAverageCost);
    if (!Number.isFinite(quantity) || quantity <= 0 || (averageCost !== null && (!Number.isFinite(averageCost) || averageCost < 0))) {
      setPositionError("Enter a quantity greater than zero and a valid average cost.");
      return;
    }
    setPositionSaving(true);
    setPositionError("");
    try {
      const response = await fetch(`/api/watchlists/${showPositionModal.watchlistId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: showPositionModal.itemId,
          quantity,
          averageCost,
          householdLabel: positionHousehold,
          currency: positionCurrency,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Could not save position");
      setWatchlist((current) => current.map((item) => item.itemId === showPositionModal.itemId ? {
        ...item,
        quantity,
        averageCost,
        householdLabel: positionHousehold.trim() || null,
        currency: positionCurrency,
        positionAsOf: new Date().toISOString(),
      } : item));
      setShowPositionModal(null);
    } catch (error) {
      setPositionError(error instanceof Error ? error.message : "Could not save position");
    } finally {
      setPositionSaving(false);
    }
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
  const positioned = watchlist.filter((stock) => stock.quantity !== null && stock.quantity > 0);
  const valuesByCurrency = positioned.reduce<Record<string, number>>((totals, stock) => {
    if (stock.price <= 0 || stock.quantity === null) return totals;
    const currency = stock.currency || "CAD";
    totals[currency] = (totals[currency] ?? 0) + stock.price * stock.quantity;
    return totals;
  }, {});
  const currencyValues = Object.entries(valuesByCurrency).sort(([a], [b]) => a.localeCompare(b));
  const formatMarketValue = (value: number, currency: string) => new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageHead
        title="Client portfolios"
        description="Monitor advisor-supplied positions, current market values, material movements, and client portfolio context."
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
          <Badge>{watchlist.length} holdings</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add holding
          </Button>
        </div>
      </div>

      {storageMode === "local" && (
        <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          Saved on this device while account sync is unavailable. Your selections will be reconciled when the database reconnects.
        </div>
      )}

      <section aria-label="Tracked portfolio value" className="overflow-hidden rounded-[24px] border border-outline-variant bg-surface-container-lowest">
        <div className="grid lg:grid-cols-[minmax(0,1.5fr)_minmax(12rem,0.6fr)_minmax(12rem,0.6fr)]">
          <div className="border-b border-outline-variant p-5 lg:border-b-0 lg:border-r md:p-6">
            <div className="flex items-center gap-2 text-primary">
              <WalletCards className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]">Tracked market value</p>
            </div>
            {currencyValues.length ? (
              <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                {currencyValues.map(([currency, value], index) => (
                  <div key={currency} className="flex items-baseline gap-2">
                    <span className={cn("font-mono font-semibold text-on-surface", index === 0 ? "text-3xl md:text-4xl" : "text-xl")}>
                      {formatMarketValue(value, currency)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{currency}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => watchlist[0] && openPositionEditor(watchlist[0])} className="mt-3 text-left font-display text-2xl font-semibold text-on-surface hover:text-primary">
                Add position quantities to calculate value
              </button>
            )}
            <p className="mt-2 text-xs text-on-surface-variant">Calculated from advisor-supplied quantities and the latest available market prices. Currencies are kept separate.</p>
          </div>
          <div className="border-b border-outline-variant p-5 lg:border-b-0 lg:border-r">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Positions valued</p>
            <p className="mt-3 font-mono text-2xl font-semibold text-on-surface">{positioned.length}<span className="text-sm text-on-surface-variant"> / {watchlist.length}</span></p>
            <p className="mt-1 text-xs text-on-surface-variant">Holdings with a saved quantity</p>
          </div>
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Needs position data</p>
            <p className={cn("mt-3 font-mono text-2xl font-semibold", watchlist.length - positioned.length ? "text-warning" : "text-primary")}>{watchlist.length - positioned.length}</p>
            <p className="mt-1 text-xs text-on-surface-variant">Add units to complete the view</p>
          </div>
        </div>
      </section>

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
          <span className="mx-1 h-5 w-px flex-none bg-outline-variant" />
          <div className="flex flex-none items-center rounded-full border border-outline-variant bg-surface-container-low p-1" aria-label="Watchlist layout">
            <button onClick={() => selectWatchlistView("list")} aria-label="List view" aria-pressed={watchlistView === "list"} className={cn("rounded-full p-1.5 transition-colors", watchlistView === "list" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface")}><List className="h-4 w-4" /></button>
            <button onClick={() => selectWatchlistView("grid")} aria-label="Grid view" aria-pressed={watchlistView === "grid"} className={cn("rounded-full p-1.5 transition-colors", watchlistView === "grid" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface")}><Grid2X2 className="h-4 w-4" /></button>
          </div>
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
              <h2 className="font-display font-bold text-lg text-on-surface">Add holding</h2>
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
                    onClick={() => addStock(stock.symbol)}
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

      {showPositionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] border border-outline-variant bg-surface-container shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <CircleDollarSign className="h-4 w-4" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]">Advisor-supplied position</p>
                </div>
                <h2 className="mt-2 font-display text-2xl font-semibold text-on-surface">{showPositionModal.symbol}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{showPositionModal.companyName}</p>
              </div>
              <button onClick={() => setShowPositionModal(null)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface" aria-label="Close position editor"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-on-surface">Shares or units</span>
                  <input type="number" min="0" step="0.000001" value={positionQuantity} onChange={(event) => setPositionQuantity(event.target.value)} placeholder="0" className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 font-mono text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" autoFocus />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-on-surface">Average cost per unit <span className="font-normal text-on-surface-variant">optional</span></span>
                  <input type="number" min="0" step="0.01" value={positionAverageCost} onChange={(event) => setPositionAverageCost(event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 font-mono text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-on-surface">Household or account</span>
                  <input type="text" maxLength={100} value={positionHousehold} onChange={(event) => setPositionHousehold(event.target.value)} placeholder="Example: Morgan household" className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-on-surface">Currency</span>
                  <select value={positionCurrency} onChange={(event) => setPositionCurrency(event.target.value)} className="w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
              </div>
              {positionQuantity && showPositionModal.price > 0 && Number(positionQuantity) > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
                  <span className="text-xs font-semibold text-on-surface-variant">Calculated market value</span>
                  <span className="font-mono text-lg font-semibold text-on-surface">{formatMarketValue(Number(positionQuantity) * showPositionModal.price, positionCurrency)}</span>
                </div>
              )}
              {positionError && <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{positionError}</p>}
              <p className="text-xs leading-5 text-on-surface-variant">This supports advisor monitoring and does not replace the dealer book of record. Confirm quantities whenever the client portfolio changes.</p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-outline-variant p-4">
              <Button variant="ghost" onClick={() => setShowPositionModal(null)}>Cancel</Button>
              <Button onClick={() => void savePosition()} disabled={positionSaving || !positionQuantity} loading={positionSaving}>Save position</Button>
            </div>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-container rounded-xl border border-outline-variant w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <h2 className="font-display font-bold text-lg text-on-surface">
                Set Alert - {showAlertModal.symbol}
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

      {watchlistView === "list" ? (
      <div className="bg-surface-container-low border border-outline-variant rounded-[24px] overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2.5 bg-surface-container border-b border-outline-variant text-on-surface-variant text-xs font-mono uppercase tracking-wider">
          <span className="col-span-1" />
          <span className="col-span-2">Symbol</span>
          <span className="col-span-2 text-right">Quantity</span>
          <span className="col-span-2 text-right">Market value</span>
          <span className="col-span-2 text-right">Today</span>
          <span className="col-span-2 text-right">Intraday</span>
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
                <div className="md:col-span-2">
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
                  <span className="text-xs text-on-surface-variant md:hidden mr-2">Quantity:</span>
                  <span className="font-mono text-on-surface">
                    {stock.quantity === null ? "Not added" : stock.quantity.toLocaleString("en-CA", { maximumFractionDigits: 6 })}
                  </span>
                  {stock.householdLabel && <span className="mt-0.5 block truncate text-[10px] text-on-surface-variant">{stock.householdLabel}</span>}
                </div>
                <div className="md:col-span-2 md:text-right">
                  <span className="text-xs text-on-surface-variant md:hidden mr-2">Market value:</span>
                  <span className="font-mono text-sm font-semibold text-on-surface">{stock.quantity !== null && stock.price > 0 ? formatMarketValue(stock.quantity * stock.price, stock.currency) : "-"}</span>
                  <span className="mt-0.5 block text-[10px] text-on-surface-variant">{stock.price > 0 ? `${formatPrice(stock.price)} ${stock.currency}` : "Price unavailable"}</span>
                </div>
                <div className={cn("md:col-span-2 md:text-right font-mono text-sm", trendColor)}>
                  <span className="text-xs text-on-surface-variant md:hidden mr-2">Today:</span>
                  {stock.price > 0 ? `${formatChange(stock.change)} · ${formatPercent(stock.changePercent)}` : "-"}
                </div>
                <div className="hidden md:flex md:col-span-2 justify-end">
                  {stock.price > 0 && (
                    <MiniChart
                      symbol={stock.symbol}
                      positive={trend === "up"}
                    />
                  )}
                </div>
                <div className="md:col-span-1 flex justify-end gap-1">
                  <button
                    onClick={() => openPositionEditor(stock)}
                    className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors"
                    aria-label={`${stock.quantity === null ? "Add" : "Edit"} position for ${stock.symbol}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
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
                    onClick={() => void removeStock(stock)}
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading && (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-on-surface-variant">Loading watchlist...</span>
            </div>
          )}
          {!loading && filtered.map((stock) => {
            const trend = getTrendDirection(stock.change);
            const trendColor = trend === "up" ? "text-primary" : trend === "down" ? "text-error" : "text-on-surface-variant";
            return (
              <article key={stock.symbol} className="rounded-[28px] bg-surface-container-low p-5 transition-colors hover:bg-surface-container">
                <div className="flex items-start justify-between gap-3">
                  <a href={`/markets/${stock.symbol}`} className="min-w-0 hover:text-primary">
                    <span className="block font-mono text-lg font-semibold text-on-surface">{stock.symbol}</span>
                    <span className="block truncate text-xs text-on-surface-variant">{stock.companyName} · {stock.exchangeCode}</span>
                  </a>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setShowAlertModal(stock); setAlertPrice(stock.price > 0 ? String(Math.round(stock.price)) : ""); }} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-primary" aria-label={`Set price alert for ${stock.symbol}`}><Bell className="h-4 w-4" /></button>
                    <button onClick={() => void removeStock(stock)} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-error" aria-label={`Remove ${stock.symbol} from watchlist`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <MiniChart symbol={stock.symbol} positive={trend === "up"} className="my-5 h-20" />
                <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl bg-surface-container-high/60 p-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Quantity</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-on-surface">{stock.quantity === null ? "Not added" : stock.quantity.toLocaleString("en-CA", { maximumFractionDigits: 6 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Market value</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-on-surface">{stock.quantity !== null && stock.price > 0 ? formatMarketValue(stock.quantity * stock.price, stock.currency) : "-"}</p>
                  </div>
                  {stock.householdLabel && <p className="col-span-2 truncate border-t border-outline-variant pt-2 text-xs text-on-surface-variant">{stock.householdLabel}</p>}
                </div>
                <div className="flex items-end justify-between gap-4 border-t border-outline-variant pt-4">
                  <div>
                    <p className="text-xs text-on-surface-variant">Latest available</p>
                    <p className="mt-1 font-mono text-2xl font-semibold text-on-surface">{stock.price > 0 ? formatPrice(stock.price) : "-"}</p>
                  </div>
                  <div className={cn("text-right font-mono", trendColor)}>
                    <p className="text-sm">{stock.price > 0 ? formatChange(stock.change) : "-"}</p>
                    <p className="mt-1 text-sm">{stock.price > 0 ? formatPercent(stock.changePercent) : "-"}</p>
                  </div>
                </div>
                <button onClick={() => openPositionEditor(stock)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary"><Pencil className="h-3.5 w-3.5" />{stock.quantity === null ? "Add position details" : "Edit position"}</button>
              </article>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-on-surface-variant">
            {searchQuery
              ? "No stocks match your search"
              : "Your watchlist is empty - click Add Stock to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
