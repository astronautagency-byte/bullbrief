"use client";

import { useEffect, useId, useState } from "react";
import { Check, Loader2, Plus, Search, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatVolume } from "@/lib/types";

type PositionData = {
  symbol: string; companyName: string; price: number | null; changePercent: number | null;
  currency: string | null; marketCap: number | null; pe: number | null;
  priceToBook: number | null; priceToSales: number | null; dividendYield: number | null;
  starRating: number | null; fairValue: number | null; economicMoat: string | null;
  sector: string | null; industry: string | null; researchAvailable: boolean;
};
type SearchResult = { symbol: string; name: string; exchange: string };

const fmt = (value: number | null, suffix = "") =>
  value == null ? "-" : `${value.toFixed(2)}${suffix}`;

export function PositionLens() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<PositionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const resultListId = useId();

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const response = await fetch(`/api/markets/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Search is unavailable.");
        setSearchResults((json.data ?? []).filter((item: SearchResult) =>
          item.symbol && item.name && item.exchange
        ));
      } catch (reason) {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setSearchError(reason instanceof Error ? reason.message : "Search is unavailable.");
        }
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function selectProduct(product: SearchResult) {
    const key = `${product.symbol}:${product.exchange}`;
    if (selected.some((item) => `${item.symbol}:${item.exchange}` === key)) return;
    if (selected.length >= 4) {
      setError("Compare up to four products at a time.");
      return;
    }
    setSelected((current) => [...current, product]);
    setQuery("");
    setSearchResults([]);
    setResults([]);
    setError("");
  }

  async function reviewProducts() {
    if (!selected.length) return;
    setLoading(true);
    setError("");
    try {
      const payloads = await Promise.all(
        selected.map(async (product) => {
          const params = new URLSearchParams({
            symbol: product.symbol,
            exchange: product.exchange,
          });
          const response = await fetch(`/api/picks/position?${params.toString()}`);
          const json = await response.json();
          if (!response.ok) throw new Error(`${product.symbol}: ${json.error || "data unavailable"}`);
          return json.data as PositionData;
        })
      );
      setResults(payloads);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Product research is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function removeProduct(symbol: string, exchange: string) {
    setSelected((current) => current.filter((item) => item.symbol !== symbol || item.exchange !== exchange));
    setResults([]);
  }

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="border-b border-outline-variant p-5 md:p-7" style={{ backgroundImage: "linear-gradient(110deg, rgb(var(--brand-primary-rgb, 75 226 119) / 0.10), transparent 55%)" }}>
        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          <ShieldCheck className="h-4 w-4" /> Product review
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface md:text-3xl">
              Review a reasonable range.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
              Select up to four securities, then review their identity, valuation and research evidence side by side.
            </p>
          </div>
          <div className="relative self-end">
            <label htmlFor="product-search" className="mb-2 block text-xs text-on-surface-variant">Search by company or ticker</label>
            <div className="flex rounded-lg border border-outline-variant bg-surface-container-low p-1 focus-within:border-primary/60">
              <Search className="ml-2 h-4 w-4 self-center text-on-surface-variant" />
              <input
                id="product-search"
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  if (value.trim().length < 2) {
                    setSearchResults([]);
                    setSearchError("");
                  }
                }}
                placeholder="Enbridge, AAPL, Shopify…"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={query.trim().length >= 2}
                aria-controls={resultListId}
                className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
              {searching && <Loader2 className="mr-3 h-4 w-4 self-center animate-spin text-primary" />}
            </div>
            {query.trim().length >= 2 && (
              <div id={resultListId} role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container shadow-2xl">
                {searching ? (
                  <p className="px-4 py-4 text-xs text-on-surface-variant" role="status">Searching verified listings…</p>
                ) : searchError ? (
                  <p className="px-4 py-4 text-xs text-error" role="alert">{searchError}</p>
                ) : searchResults.length ? searchResults.map((product) => (
                  <button
                    key={`${product.symbol}:${product.exchange}`}
                    role="option"
                    aria-selected={selected.some((item) => item.symbol === product.symbol && item.exchange === product.exchange)}
                    onClick={() => selectProduct(product)}
                    disabled={selected.some((item) => item.symbol === product.symbol && item.exchange === product.exchange)}
                    className="flex w-full items-center justify-between gap-4 border-b border-outline-variant/50 px-4 py-3 text-left last:border-0 hover:bg-surface-container-high disabled:opacity-50"
                  >
                    <span>
                      <span className="block text-sm font-medium text-on-surface">{product.name}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-on-surface-variant">{product.symbol} · {product.exchange}</span>
                    </span>
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                  </button>
                )) : (
                  <p className="px-4 py-4 text-xs text-on-surface-variant" role="status">No verified listings found. Try a company name or ticker.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 md:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-9 flex-wrap items-center gap-2">
            {selected.length ? selected.map((product) => (
              <span key={`${product.symbol}:${product.exchange}`} className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary">
                <span><span className="font-mono">{product.symbol}</span> <span className="text-primary/70">· {product.name}</span></span>
                <button onClick={() => removeProduct(product.symbol, product.exchange)} aria-label={`Remove ${product.name}`}><X className="h-3 w-3" /></button>
              </span>
            )) : <span className="text-xs text-on-surface-variant">No products selected</span>}
          </div>
          <button
            onClick={() => void reviewProducts()}
            disabled={!selected.length || loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-on-primary disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Review selected
          </button>
        </div>
        {error && <p className="mb-4 rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error">{error}</p>}

        {results.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container">
                  <th className="w-40 p-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Review area</th>
                  {results.map((item) => (
                    <th key={item.symbol} className="p-3">
                      <span className="block font-mono text-xs text-primary">{item.symbol}</span>
                      <span className="mt-1 block text-sm font-semibold text-on-surface">{item.companyName}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Product identity", (item: PositionData) => [item.sector, item.industry].filter(Boolean).join(" · ") || "Classification unavailable"],
                  ["Market price", (item: PositionData) => `${fmt(item.price)} ${item.currency ?? ""}`],
                  ["Today", (item: PositionData) => `${(item.changePercent ?? 0) >= 0 ? "+" : ""}${fmt(item.changePercent, "%")}`],
                  ["Research rating", (item: PositionData) => item.starRating == null ? "Not rated" : `${item.starRating} / 5`],
                  ["Business quality", (item: PositionData) => item.economicMoat || "Not rated"],
                  ["Valuation", (item: PositionData) => `P/E ${fmt(item.pe)} · P/B ${fmt(item.priceToBook)}`],
                  ["Market profile", (item: PositionData) => `${formatVolume(item.marketCap)} cap · P/S ${fmt(item.priceToSales)}`],
                  ["Income", (item: PositionData) => item.dividendYield == null ? "Yield unavailable" : `${fmt(item.dividendYield, "%")} yield`],
                  ["Data status", (item: PositionData) => item.researchAvailable ? "Market + research data" : "Market data only"],
                ].map(([label, render]) => (
                  <tr key={label as string} className="border-b border-outline-variant/60 last:border-0">
                    <th className="bg-surface-container-low p-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{label as string}</th>
                    {results.map((item) => (
                      <td key={item.symbol} className={cn("p-3 text-xs text-on-surface", label === "Today" && (item.changePercent ?? 0) >= 0 ? "text-primary" : label === "Today" ? "text-error" : "")}>
                        {(render as (value: PositionData) => string)(item)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-outline-variant px-4 py-6 text-center text-xs text-on-surface-variant">
            Add products, then choose “Review selected” to generate the comparison.
          </div>
        )}

        <p className="mt-4 text-[11px] leading-5 text-on-surface-variant">
          Market prices are provided by Yahoo Finance. Available research fields come through BullBrief’s configured Morningstar API integration and may be delayed or unavailable. This review does not determine client suitability or constitute a recommendation.
        </p>
      </div>
    </section>
  );
}
