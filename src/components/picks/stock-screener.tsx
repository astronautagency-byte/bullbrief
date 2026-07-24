"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import {
  Search,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

interface ScreenerStock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
}

const STOCK_DATABASE: ScreenerStock[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", price: 0, change: 0, changePercent: 0 },
  { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", price: 0, change: 0, changePercent: 0 },
  { symbol: "JPM", name: "JPMorgan Chase", exchange: "NYSE", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", sector: "Healthcare", price: 0, change: 0, changePercent: 0 },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", sector: "Consumer Defensive", price: 0, change: 0, changePercent: 0 },
  { symbol: "UNH", name: "UnitedHealth Group", exchange: "NYSE", sector: "Healthcare", price: 0, change: 0, changePercent: 0 },
  { symbol: "HD", name: "Home Depot", exchange: "NYSE", sector: "Consumer Cyclical", price: 0, change: 0, changePercent: 0 },
  { symbol: "BAC", name: "Bank of America", exchange: "NYSE", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "XOM", name: "Exxon Mobil", exchange: "NYSE", sector: "Energy", price: 0, change: 0, changePercent: 0 },
  { symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE", sector: "Healthcare", price: 0, change: 0, changePercent: 0 },
  { symbol: "CRM", name: "Salesforce Inc.", exchange: "NYSE", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "COST", name: "Costco Wholesale", exchange: "NASDAQ", sector: "Consumer Defensive", price: 0, change: 0, changePercent: 0 },
  { symbol: "COIN", name: "Coinbase Global", exchange: "NASDAQ", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "PLTR", name: "Palantir Technologies", exchange: "NYSE", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "UBER", name: "Uber Technologies", exchange: "NYSE", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "SHOP", name: "Shopify Inc.", exchange: "TSX", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "TD", name: "Toronto-Dominion Bank", exchange: "TSX", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "RY", name: "Royal Bank of Canada", exchange: "TSX", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "ENB", name: "Enbridge Inc.", exchange: "TSX", sector: "Energy", price: 0, change: 0, changePercent: 0 },
  { symbol: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ", sector: "Communication Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "AMD", name: "Advanced Micro Devices", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "INTC", name: "Intel Corp.", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "DIS", name: "Walt Disney Co.", exchange: "NYSE", sector: "Communication Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "BA", name: "Boeing Co.", exchange: "NYSE", sector: "Industrials", price: 0, change: 0, changePercent: 0 },
  { symbol: "GS", name: "Goldman Sachs", exchange: "NYSE", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "SQ", name: "Block Inc.", exchange: "NYSE", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "BABA", name: "Alibaba Group", exchange: "NYSE", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "NIO", name: "NIO Inc.", exchange: "NYSE", sector: "Consumer Cyclical", price: 0, change: 0, changePercent: 0 },
  { symbol: "RIVN", name: "Rivian Automotive", exchange: "NASDAQ", sector: "Consumer Cyclical", price: 0, change: 0, changePercent: 0 },
  { symbol: "SNOW", name: "Snowflake Inc.", exchange: "NYSE", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "ABNB", name: "Airbnb Inc.", exchange: "NASDAQ", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "SPOT", name: "Spotify Technology", exchange: "NYSE", sector: "Communication Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "PG", name: "Procter & Gamble", exchange: "NYSE", sector: "Consumer Defensive", price: 0, change: 0, changePercent: 0 },
  { symbol: "MA", name: "Mastercard Inc.", exchange: "NYSE", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "BNS", name: "Bank of Nova Scotia", exchange: "TSX", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "BMO", name: "Bank of Montreal", exchange: "TSX", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "CNR", name: "Canadian National Railway", exchange: "TSX", sector: "Industrials", price: 0, change: 0, changePercent: 0 },
  { symbol: "SU", name: "Suncor Energy", exchange: "TSX", sector: "Energy", price: 0, change: 0, changePercent: 0 },
  { symbol: "CNQ", name: "Canadian Natural Resources", exchange: "TSX", sector: "Energy", price: 0, change: 0, changePercent: 0 },
  { symbol: "BAM", name: "Brookfield Asset Management", exchange: "TSX", sector: "Financial Services", price: 0, change: 0, changePercent: 0 },
  { symbol: "L", name: "Loblaw Companies", exchange: "TSX", sector: "Consumer Defensive", price: 0, change: 0, changePercent: 0 },
  { symbol: "ATD", name: "Alimentation Couche-Tard", exchange: "TSX", sector: "Consumer Defensive", price: 0, change: 0, changePercent: 0 },
  { symbol: "DOL", name: "Dollarama Inc.", exchange: "TSX", sector: "Consumer Defensive", price: 0, change: 0, changePercent: 0 },
  { symbol: "CSU", name: "Constellation Software", exchange: "TSX", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "BB", name: "BlackBerry Ltd.", exchange: "TSX", sector: "Technology", price: 0, change: 0, changePercent: 0 },
  { symbol: "T", name: "BCE Inc.", exchange: "TSX", sector: "Communication Services", price: 0, change: 0, changePercent: 0 },
];

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Industrials",
  "Energy",
  "Consumer Defensive",
  "Communication Services",
];

type SortField = "symbol" | "name" | "price" | "change" | "sector";
type SortDir = "asc" | "desc";

export function StockScreener() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("");
  const [exchange, setExchange] = useState<string>("");
  const [results, setResults] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showFilters, setShowFilters] = useState(true);

  const fetchPrices = useCallback(async (stocks: ScreenerStock[]) => {
    if (stocks.length === 0) return stocks;
    const symbols = stocks.map((s) => s.symbol);
    try {
      const res = await fetch(`/api/watchlist-local?symbols=${symbols.join(",")}`);
      const json = await res.json();
      const priceMap: Record<string, { price: number; change: number; changePercent: number }> = {};
      for (const d of json.data ?? []) {
        priceMap[d.symbol] = { price: d.price ?? 0, change: d.change ?? 0, changePercent: d.changePercent ?? 0 };
      }
      return stocks.map((s) => ({
        ...s,
        price: priceMap[s.symbol]?.price ?? 0,
        change: priceMap[s.symbol]?.change ?? 0,
        changePercent: priceMap[s.symbol]?.changePercent ?? 0,
      }));
    } catch {
      return stocks;
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    // Filter local database
    let filtered = STOCK_DATABASE.filter((s) => {
      const matchesQuery = !query ||
        s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase());
      const matchesSector = !sector || s.sector === sector;
      const matchesExchange = !exchange || s.exchange === exchange;
      return matchesQuery && matchesSector && matchesExchange;
    });

    // Fetch prices for filtered results
    fetchPrices(filtered).then((withPrices) => {
      setResults(withPrices);
      setLoading(false);
    });
  }, [query, sector, exchange, fetchPrices]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "symbol" || field === "name" || field === "sector" ? "asc" : "desc");
    }
  };

  const sorted = [...results].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case "symbol": cmp = a.symbol.localeCompare(b.symbol); break;
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "price": cmp = a.price - b.price; break;
      case "change": cmp = a.changePercent - b.changePercent; break;
      case "sector": cmp = a.sector.localeCompare(b.sector); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by name or ticker..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-xl">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="">All Sectors</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Exchange
            </label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="">All Exchanges</option>
              <option value="NASDAQ">NASDAQ</option>
              <option value="NYSE">NYSE</option>
              <option value="TSX">TSX (Canada)</option>
            </select>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
          <span className="text-on-surface-variant text-sm">Loading stocks...</span>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2.5 bg-surface-container border-b border-outline-variant text-on-surface-variant text-xs font-mono uppercase tracking-wider">
            <button onClick={() => toggleSort("symbol")} className="col-span-2 text-left hover:text-primary transition-colors">
              Ticker <SortIcon field="symbol" />
            </button>
            <button onClick={() => toggleSort("name")} className="col-span-3 text-left hover:text-primary transition-colors">
              Company <SortIcon field="name" />
            </button>
            <button onClick={() => toggleSort("price")} className="col-span-2 text-right hover:text-primary transition-colors">
              Price <SortIcon field="price" />
            </button>
            <button onClick={() => toggleSort("change")} className="col-span-2 text-right hover:text-primary transition-colors">
              Change <SortIcon field="change" />
            </button>
            <button onClick={() => toggleSort("sector")} className="col-span-2 text-left hover:text-primary transition-colors">
              Sector <SortIcon field="sector" />
            </button>
            <span className="col-span-1 text-right">Exchange</span>
          </div>

          {/* Rows */}
          {sorted.map((stock) => {
            const positive = stock.change >= 0;
            return (
              <a
                key={stock.symbol}
                href={`/markets/${stock.symbol}`}
                className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-outline-variant/50 last:border-b-0 hover:bg-surface-container-high transition-colors items-center"
              >
                <div className="col-span-12 md:col-span-2">
                  <span className="font-mono font-bold text-on-surface text-sm">{stock.symbol}</span>
                </div>
                <div className="col-span-8 md:col-span-3">
                  <span className="text-xs text-on-surface-variant">{stock.name}</span>
                </div>
                <div className="col-span-4 md:col-span-2 text-right">
                  <span className="font-mono text-sm text-on-surface">
                    {stock.price > 0 ? `$${stock.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2 text-right">
                  {stock.price > 0 ? (
                    <span className={cn(
                      "font-mono text-xs px-2 py-0.5 rounded",
                      positive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                    )}>
                      {positive ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-on-surface-variant/30 text-xs">—</span>
                  )}
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Badge variant="outline" className="text-[10px]">
                    {stock.sector}
                  </Badge>
                </div>
                <div className="hidden md:block col-span-1 text-right">
                  <span className="text-on-surface-variant text-xs">{stock.exchange}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="text-center py-12">
          <p className="text-on-surface-variant text-sm">
            {query || sector || exchange
              ? "No stocks match your search. Try different keywords."
              : "No stocks available."}
          </p>
        </div>
      )}
    </div>
  );
}
