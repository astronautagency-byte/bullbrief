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
} from "lucide-react";

interface ScreenerStock {
  meta: {
    securityID: string;
    performanceID: string;
    ticker: string;
    exchange: string;
  };
  fields: {
    name: { value: string };
    isin: { value: string };
    priceToEarnings: { value: number };
    sector: { value: string };
    marketCap: { value: number };
    morningstarOverallRating: { value: number };
  };
}

const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer Cyclical",
  "Industrials",
  "Energy",
  "Consumer Defensive",
  "Basic Materials",
  "Communication Services",
  "Real Estate",
  "Utilities",
];

type SortField = "name" | "pe" | "marketCap" | "rating";
type SortDir = "asc" | "desc";

export function StockScreener() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("");
  const [peMax, setPeMax] = useState<string>("");
  const [starMin, setStarMin] = useState<string>("");
  const [results, setResults] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(true);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (sector) params.set("sector", sector);
      if (peMax) params.set("peMax", peMax);
      if (starMin) params.set("starMin", starMin);

      const res = await fetch(`/api/picks/screener?${params.toString()}`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, sector, peMax, starMin]);

  useEffect(() => {
    const timer = setTimeout(fetchResults, 500);
    return () => clearTimeout(timer);
  }, [fetchResults]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = [...results].sort((a, b) => {
    const aVal = a.fields;
    const bVal = b.fields;
    let cmp = 0;

    switch (sortField) {
      case "name":
        cmp = (aVal.name?.value ?? "").localeCompare(bVal.name?.value ?? "");
        break;
      case "pe":
        cmp = (aVal.priceToEarnings?.value ?? 0) - (bVal.priceToEarnings?.value ?? 0);
        break;
      case "marketCap":
        cmp = (aVal.marketCap?.value ?? 0) - (bVal.marketCap?.value ?? 0);
        break;
      case "rating":
        cmp = (aVal.morningstarOverallRating?.value ?? 0) - (bVal.morningstarOverallRating?.value ?? 0);
        break;
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

  const formatMarketCap = (val: number) => {
    if (!val) return "—";
    if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search stocks by name or ticker..."
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low border border-outline-variant rounded-xl">
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
              Max P/E Ratio
            </label>
            <input
              type="number"
              placeholder="e.g. 25"
              value={peMax}
              onChange={(e) => setPeMax(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5">
              Min Morningstar Rating
            </label>
            <select
              value={starMin}
              onChange={(e) => setStarMin(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="">Any Rating</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin mr-2" />
          <span className="text-on-surface-variant text-sm">Screening stocks...</span>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-2.5 bg-surface-container border-b border-outline-variant text-on-surface-variant text-xs font-mono uppercase tracking-wider">
            <button
              onClick={() => toggleSort("name")}
              className="col-span-4 text-left hover:text-primary transition-colors"
            >
              Stock <SortIcon field="name" />
            </button>
            <button
              onClick={() => toggleSort("rating")}
              className="col-span-2 text-left hover:text-primary transition-colors"
            >
              Rating <SortIcon field="rating" />
            </button>
            <button
              onClick={() => toggleSort("pe")}
              className="col-span-2 text-right hover:text-primary transition-colors"
            >
              P/E <SortIcon field="pe" />
            </button>
            <button
              onClick={() => toggleSort("marketCap")}
              className="col-span-2 text-right hover:text-primary transition-colors"
            >
              Market Cap <SortIcon field="marketCap" />
            </button>
            <span className="col-span-2 text-right">Sector</span>
          </div>

          {/* Rows */}
          {sorted.map((stock) => (
            <a
              key={stock.meta.securityID}
              href={`/markets/${stock.meta.ticker}`}
              className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-outline-variant/50 last:border-b-0 hover:bg-surface-container-high transition-colors items-center"
            >
              <div className="col-span-12 md:col-span-4">
                <span className="font-mono font-medium text-on-surface block">
                  {stock.meta.ticker}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {stock.fields.name?.value ?? "—"}
                </span>
              </div>
              <div className="col-span-4 md:col-span-2">
                <StarRating
                  rating={stock.fields.morningstarOverallRating?.value ?? 0}
                  size="sm"
                  showValue
                />
              </div>
              <div className="col-span-4 md:col-span-2 text-right">
                <span className="font-mono text-sm text-on-surface">
                  {stock.fields.priceToEarnings?.value
                    ? stock.fields.priceToEarnings.value.toFixed(1)
                    : "—"}
                </span>
              </div>
              <div className="col-span-4 md:col-span-2 text-right">
                <span className="font-mono text-sm text-on-surface">
                  {formatMarketCap(stock.fields.marketCap?.value)}
                </span>
              </div>
              <div className="hidden md:block col-span-2 text-right">
                <Badge variant="outline" className="text-[10px]">
                  {stock.fields.sector?.value ?? "—"}
                </Badge>
              </div>
            </a>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-on-surface-variant text-sm">
            {query || sector || peMax || starMin
              ? "No stocks match your filters. Try adjusting your criteria."
              : "Enter a search or set filters to find stocks."}
          </p>
        </div>
      )}
    </div>
  );
}
