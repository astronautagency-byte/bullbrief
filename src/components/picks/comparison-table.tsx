"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { StarRating } from "./star-rating";
import { MiniChart } from "@/components/ui/mini-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  X,
  Loader2,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Printer,
} from "lucide-react";

interface StockData {
  symbol: string;
  companyName: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  starRating: number | null;
  starOutOf: number;
  pe: number | null;
  pegRatio: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  totalReturn1Y: number | null;
  totalReturn3Y: number | null;
  totalReturn5Y: number | null;
  morningstarRating3Y: number | null;
  morningstarRating5Y: number | null;
  morningstarRating10Y: number | null;
  processRating: string | null;
  peopleRating: string | null;
  parentRating: string | null;
  esgRiskRating: string | null;
}

type AssetType = "stock" | "fund";

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
  { symbol: "NFLX", name: "Netflix Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "DIS", name: "Walt Disney Co." },
  { symbol: "BA", name: "Boeing Co." },
  { symbol: "GS", name: "Goldman Sachs" },
  { symbol: "SQ", name: "Block Inc." },
  { symbol: "BABA", name: "Alibaba Group" },
  { symbol: "NIO", name: "NIO Inc." },
  { symbol: "RIVN", name: "Rivian Automotive" },
  { symbol: "SNOW", name: "Snowflake Inc." },
  { symbol: "ABNB", name: "Airbnb Inc." },
  { symbol: "SPOT", name: "Spotify Technology" },
  { symbol: "PG", name: "Procter & Gamble" },
  { symbol: "MA", name: "Mastercard Inc." },
  // Canadian stocks (TSX)
  { symbol: "SHOP", name: "Shopify Inc. (TSX)" },
  { symbol: "TD", name: "Toronto-Dominion Bank (TSX)" },
  { symbol: "RY", name: "Royal Bank of Canada (TSX)" },
  { symbol: "ENB", name: "Enbridge Inc. (TSX)" },
  { symbol: "BNS", name: "Bank of Nova Scotia (TSX)" },
  { symbol: "BMO", name: "Bank of Montreal (TSX)" },
  { symbol: "CNR", name: "Canadian National Railway (TSX)" },
  { symbol: "SU", name: "Suncor Energy (TSX)" },
  { symbol: "CNQ", name: "Canadian Natural Resources (TSX)" },
  { symbol: "BAM", name: "Brookfield Asset Mgmt (TSX)" },
  { symbol: "L", name: "Loblaw Companies (TSX)" },
  { symbol: "ATD", name: "Alimentation Couche-Tard (TSX)" },
  { symbol: "DOL", name: "Dollarama Inc. (TSX)" },
  { symbol: "CSU", name: "Constellation Software (TSX)" },
  { symbol: "BB", name: "BlackBerry Ltd. (TSX)" },
  { symbol: "T", name: "BCE Inc. (TSX)" },
];

const POPULAR_FUNDS = [
  { symbol: "VFIAX", name: "Vanguard 500 Index Admiral" },
  { symbol: "FXAIX", name: "Fidelity 500 Index Fund" },
  { symbol: "SWPPX", name: "Schwab S&P 500 Index Fund" },
  { symbol: "VFINX", name: "Vanguard 500 Index Investor" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF" },
  { symbol: "IVV", name: "iShares Core S&P 500 ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF" },
  { symbol: "ARKK", name: "ARK Innovation ETF" },
  { symbol: "DFUSX", name: "DFA US Large Company I" },
  { symbol: "FDFIX", name: "Fidelity Flex 500 Index" },
  { symbol: "MGC", name: "Vanguard Mega Cap ETF" },
  { symbol: "SCHX", name: "Schwab U.S. Large-Cap ETF" },
  { symbol: "LRGF", name: "iShares U.S. Equity Factor ETF" },
  { symbol: "FZROX", name: "Fidelity ZERO Total Market Index" },
  { symbol: "FNILX", name: "Fidelity ZERO Large Cap Index" },
  { symbol: "VTSAX", name: "Vanguard Total Stock Mkt Idx Adm" },
  { symbol: "PTTCX", name: "T. Rowe Price Blue Chip Growth" },
  { symbol: "TRBCX", name: "T. Rowe Price Blue Chip Growth" },
];

interface ComparisonTableProps {
  assetType: AssetType;
  onAssetTypeChange: (type: AssetType) => void;
}

const STORAGE_KEY_SELECTED = "bb-compare-selected";
const STORAGE_KEY_ASSET_TYPE = "bb-compare-asset-type";
const STORAGE_KEY_EXPANDED = "bb-compare-expanded";

function loadSelected(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SELECTED);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.filter((s: unknown) => typeof s === "string");
    }
  } catch {}
  return [];
}

function saveSelected(symbols: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(symbols));
  } catch {}
}

function loadAssetType(): AssetType {
  if (typeof window === "undefined") return "stock";
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ASSET_TYPE);
    if (stored === "stock" || stored === "fund") return stored;
  } catch {}
  return "stock";
}

function saveAssetType(type: AssetType) {
  try {
    localStorage.setItem(STORAGE_KEY_ASSET_TYPE, type);
  } catch {}
}

function loadExpanded(): Record<string, boolean> {
  if (typeof window === "undefined") return { rating: true, valuation: true, performance: false, sustainability: false };
  try {
    const stored = localStorage.getItem(STORAGE_KEY_EXPANDED);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { rating: true, valuation: true, performance: false, sustainability: false };
}

function saveExpanded(sections: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify(sections));
  } catch {}
}

export function ComparisonTable({ assetType, onAssetTypeChange }: ComparisonTableProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rating: true,
    valuation: true,
    performance: false,
    sustainability: false,
  });
  const hydratedRef = useRef(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage after mount (single read, no cascading setState)
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const storedSelected = loadSelected();
    const storedAssetType = loadAssetType();
    const storedExpanded = loadExpanded();
    // Batch state updates into a single render
    setSelected(storedSelected.length > 0 ? storedSelected : []);
    setExpandedSections(storedExpanded);
    if (storedAssetType) onAssetTypeChange(storedAssetType);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage on changes
  useEffect(() => {
    if (hydratedRef.current) saveSelected(selected);
  }, [selected]);
  useEffect(() => {
    if (hydratedRef.current) saveAssetType(assetType);
  }, [assetType]);
  useEffect(() => {
    if (hydratedRef.current) saveExpanded(expandedSections);
  }, [expandedSections]);

  const popularList = assetType === "stock" ? POPULAR_STOCKS : POPULAR_FUNDS;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      saveExpanded(next);
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    if (selected.length < 2) {
      setStocks([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/picks/compare?symbols=${selected.join(",")}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setLoading(false);
        return;
      }

      setStocks(json.data ?? []);
    } catch {
      setError("Failed to fetch comparison data");
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSymbol = (sym: string) => {
    if (!selected.includes(sym) && selected.length < 6) {
      setSelected([...selected, sym.toUpperCase()]);
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const removeSymbol = (sym: string) => {
    setSelected(selected.filter((s) => s !== sym));
  };

  const filtered = popularList.filter(
    (s) =>
      !selected.includes(s.symbol) &&
      (s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePrint = () => {
    window.print();
  };

  const formatMarketCap = (val: number | null): string => {
    if (val === null) return "—";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  const formatPercent = (val: number | null): string => {
    if (val === null) return "—";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
  };

  const formatRatio = (val: number | null): string => {
    if (val === null) return "—";
    return val.toFixed(2);
  };

  const getRatingBadge = (rating: string | null) => {
    if (!rating) return <span className="text-on-surface-variant/30 text-xs">—</span>;
    const variantMap: Record<string, "positive" | "default" | "warning" | "negative"> = {
      High: "positive",
      "Above Average": "positive",
      Average: "default",
      "Below Average": "warning",
      Low: "negative",
    };
    return (
      <Badge variant={variantMap[rating] ?? "default"} className="text-[10px]">
        {rating}
      </Badge>
    );
  };

  const getEsgBadge = (rating: string | null) => {
    if (!rating) return <span className="text-on-surface-variant/30 text-xs">—</span>;
    const variantMap: Record<string, "positive" | "default" | "warning" | "negative"> = {
      Low: "positive",
      Medium: "default",
      High: "warning",
      Severe: "negative",
    };
    return (
      <Badge variant={variantMap[rating] ?? "default"} className="text-[10px]">
        {rating}
      </Badge>
    );
  };

  return (
    <div className="space-y-4" id="comparison-table">
      {/* Search and controls */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <div className="relative flex-1 min-w-[200px]" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder={`Search ${assetType === "stock" ? "stocks" : "funds"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          />
          {showSearch && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-high border border-outline-variant rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
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
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Selected chips */}
      <div className="flex items-center gap-2 flex-wrap print:hidden">
        {selected.map((sym) => {
          const stock = stocks.find((s) => s.symbol === sym);
          return (
            <div
              key={sym}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-sm"
            >
              <span className="font-mono font-medium text-primary">{sym}</span>
              {stock?.companyName && (
                <span className="text-on-surface-variant text-xs hidden sm:inline">
                  {stock.companyName.length > 20
                    ? stock.companyName.slice(0, 20) + "..."
                    : stock.companyName}
                </span>
              )}
              <button
                onClick={() => removeSymbol(sym)}
                className="text-primary/50 hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {selected.length < 6 && (
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all text-sm"
          >
            <Plus className="w-3 h-3" />
            Add {assetType === "stock" ? "stock" : "fund"}
          </button>
        )}
      </div>

      {/* Empty state */}
      {selected.length < 2 && (
        <div className="text-center py-12">
          <ArrowRightLeft className="w-10 h-10 text-on-surface-variant/20 mx-auto mb-3" />
          <p className="text-on-surface-variant text-sm">
            Select at least 2 {assetType === "stock" ? "stocks" : "funds"} to compare
          </p>
          <p className="text-on-surface-variant/50 text-xs mt-1">
            Use the search above or click &ldquo;Add {assetType === "stock" ? "stock" : "fund"}&rdquo;
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && selected.length >= 2 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
          <span className="text-on-surface-variant text-sm">Fetching comparison data...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/30 text-sm text-error">
          {error}
        </div>
      )}

      {/* Comparison Table */}
      {!loading && stocks.length >= 2 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-x-auto">
          <table className="w-full min-w-[600px]">
            {/* Header row - Stock names */}
            <thead>
              <tr>
                <th className="bg-surface-container px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-on-surface-variant w-[180px] sticky left-0 z-10">
                  {assetType === "stock" ? "Stock" : "Fund"}
                </th>
                {stocks.map((stock) => {
                  const positive = (stock.change ?? 0) >= 0;
                  return (
                    <th key={stock.symbol} className="bg-surface-container px-4 py-3 text-center min-w-[140px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`/markets/${stock.symbol}`}
                            className="font-mono font-bold text-on-surface text-sm hover:text-primary transition-colors"
                          >
                            {stock.symbol}
                          </a>
                          <button
                            onClick={() => removeSymbol(stock.symbol)}
                            className="text-on-surface-variant/20 hover:text-error transition-colors print:hidden"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[10px] text-on-surface-variant line-clamp-1">
                          {stock.companyName}
                        </span>
                        <MiniChart symbol={stock.symbol} positive={positive} className="w-full h-8" />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* Price & Change Row */}
              <tr className="border-b border-outline-variant/50">
                <td className="bg-surface-container-low px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant sticky left-0 z-10">
                  Price
                </td>
                {stocks.map((stock) => (
                  <td key={stock.symbol} className="px-4 py-3 text-center">
                    <span className="font-mono text-on-surface font-medium text-sm">
                      {stock.price !== null
                        ? `$${stock.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </span>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-outline-variant/50">
                <td className="bg-surface-container-low px-4 py-3 text-xs font-mono uppercase tracking-wider text-on-surface-variant sticky left-0 z-10">
                  Change
                </td>
                {stocks.map((stock) => {
                  const positive = (stock.change ?? 0) >= 0;
                  return (
                    <td key={stock.symbol} className="px-4 py-3 text-center">
                      {stock.change !== null ? (
                        <span
                          className={cn(
                            "font-mono text-xs px-2 py-0.5 rounded",
                            positive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          )}
                        >
                          {positive ? "+" : ""}
                          {stock.change.toFixed(2)} ({stock.changePercent?.toFixed(2)}%)
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/30 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Morningstar Rating Section */}
              <tr className="border-b border-outline-variant/50">
                <td
                  colSpan={stocks.length + 1}
                  className="bg-surface-container px-4 py-2 cursor-pointer select-none print:cursor-default"
                  onClick={() => toggleSection("rating")}
                >
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                    {expandedSections.rating ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    Morningstar Rating
                  </div>
                </td>
              </tr>

              {expandedSections.rating && (
                <>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      Overall Rating
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        {stock.starRating ? (
                          <StarRating rating={stock.starRating} size="sm" />
                        ) : (
                          <span className="text-on-surface-variant/30 text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      3-Year Rating
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        {stock.morningstarRating3Y ? (
                          <StarRating rating={stock.morningstarRating3Y} size="sm" />
                        ) : stock.starRating ? (
                          <StarRating rating={stock.starRating} size="sm" />
                        ) : (
                          <span className="text-on-surface-variant/30 text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      5-Year Rating
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        {stock.morningstarRating5Y ? (
                          <StarRating rating={stock.morningstarRating5Y} size="sm" />
                        ) : stock.starRating ? (
                          <StarRating rating={stock.starRating} size="sm" />
                        ) : (
                          <span className="text-on-surface-variant/30 text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      10-Year Rating
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        {stock.morningstarRating10Y ? (
                          <StarRating rating={stock.morningstarRating10Y} size="sm" />
                        ) : (
                          <span className="text-on-surface-variant/30 text-xs">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      Process
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        {getRatingBadge(stock.processRating)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      People
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        {getRatingBadge(stock.peopleRating)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      Parent
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        {getRatingBadge(stock.parentRating)}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Valuation Section */}
              <tr className="border-b border-outline-variant/50">
                <td
                  colSpan={stocks.length + 1}
                  className="bg-surface-container px-4 py-2 cursor-pointer select-none print:cursor-default"
                  onClick={() => toggleSection("valuation")}
                >
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                    {expandedSections.valuation ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    Valuation
                  </div>
                </td>
              </tr>

              {expandedSections.valuation && (
                <>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      P/E Ratio
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-on-surface">
                          {formatRatio(stock.pe)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      PEG Ratio
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-on-surface">
                          {formatRatio(stock.pegRatio)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      Price / Book
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-on-surface">
                          {formatRatio(stock.priceToBook)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      Price / Sales
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-on-surface">
                          {formatRatio(stock.priceToSales)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      Market Cap
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-on-surface">
                          {formatMarketCap(stock.marketCap)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      Dividend Yield
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className="font-mono text-xs text-on-surface">
                          {stock.dividendYield !== null
                            ? `${stock.dividendYield.toFixed(2)}%`
                            : "—"}
                        </span>
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Performance Section */}
              <tr className="border-b border-outline-variant/50">
                <td
                  colSpan={stocks.length + 1}
                  className="bg-surface-container px-4 py-2 cursor-pointer select-none print:cursor-default"
                  onClick={() => toggleSection("performance")}
                >
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                    {expandedSections.performance ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    Performance
                  </div>
                </td>
              </tr>

              {expandedSections.performance && (
                <>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      1-Year Return
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className={cn(
                          "font-mono text-xs",
                          stock.totalReturn1Y !== null
                            ? stock.totalReturn1Y >= 0
                              ? "text-primary"
                              : "text-error"
                            : "text-on-surface-variant/30"
                        )}>
                          {formatPercent(stock.totalReturn1Y)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      3-Year Return
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className={cn(
                          "font-mono text-xs",
                          stock.totalReturn3Y !== null
                            ? stock.totalReturn3Y >= 0
                              ? "text-primary"
                              : "text-error"
                            : "text-on-surface-variant/30"
                        )}>
                          {formatPercent(stock.totalReturn3Y)}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-outline-variant/50">
                    <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                      5-Year Return
                    </td>
                    {stocks.map((stock) => (
                      <td key={stock.symbol} className="px-4 py-3 text-center">
                        <span className={cn(
                          "font-mono text-xs",
                          stock.totalReturn5Y !== null
                            ? stock.totalReturn5Y >= 0
                              ? "text-primary"
                              : "text-error"
                            : "text-on-surface-variant/30"
                        )}>
                          {formatPercent(stock.totalReturn5Y)}
                        </span>
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {/* Sustainability Section */}
              <tr className="border-b border-outline-variant/50">
                <td
                  colSpan={stocks.length + 1}
                  className="bg-surface-container px-4 py-2 cursor-pointer select-none print:cursor-default"
                  onClick={() => toggleSection("sustainability")}
                >
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                    {expandedSections.sustainability ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    Sustainability
                  </div>
                </td>
              </tr>

              {expandedSections.sustainability && (
                <tr className="border-b border-outline-variant/50">
                  <td className="bg-surface-container-low px-4 py-3 pl-8 text-xs text-on-surface-variant sticky left-0 z-10">
                    ESG Risk Rating
                  </td>
                  {stocks.map((stock) => (
                    <td key={stock.symbol} className="px-4 py-3 text-center">
                      {getEsgBadge(stock.esgRiskRating)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Print-only header */}
      <div className="hidden print:block print:mb-4">
        <h1 className="text-lg font-bold">Bull Brief — Comparison Report</h1>
        <p className="text-xs text-gray-500">
          Generated on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          {" • "}
          {assetType === "stock" ? "Stock" : "Fund"} Comparison: {selected.join(", ")}
        </p>
      </div>
    </div>
  );
}
