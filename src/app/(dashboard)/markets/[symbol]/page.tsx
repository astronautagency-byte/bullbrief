"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Star,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatChange,
  formatPercent,
  formatPrice,
  formatVolume,
  getDataFreshnessLabel,
  type Quote,
} from "@/lib/types";
import { StockPerformanceChart } from "@/components/markets/stock-performance-chart";

const RANGE_MAP: Record<string, "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max"> = {
  "1D": "1d",
  "5D": "5d",
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  "1Y": "1y",
  "5Y": "5y",
  All: "max",
};

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  return <StockDetailClient symbol={params.symbol.toUpperCase()} />;
}

function StockDetailClient({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartRange, setChartRange] = useState("1D");
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/markets/stock?symbol=${encodeURIComponent(symbol)}&range=${RANGE_MAP[chartRange]}`
      );
      const json = await response.json();
      if (json.quote) setQuote(json.quote);
      if (json.history?.length) {
        setChartData(json.history.map((point: { value: number }) => point.value));
        setChartLabels(
          json.history.map((point: { date: string }) => {
            const date = new Date(point.date);
            return chartRange === "1D"
              ? date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })
              : date.toLocaleDateString("en-CA", {
                  month: "short",
                  day: chartRange === "5Y" || chartRange === "All" ? undefined : "numeric",
                  year: chartRange === "5Y" || chartRange === "All" ? "2-digit" : undefined,
                });
          })
        );
      } else {
        setChartData([]);
        setChartLabels([]);
      }
    } finally {
      setLoading(false);
      setLoadingChart(false);
    }
  }, [chartRange, symbol]);

  useEffect(() => {
    void fetchQuote();
  }, [fetchQuote]);

  const periodChange = (chartData.at(-1) ?? 0) - (chartData[0] ?? 0);
  const periodChangePercent = chartData[0] ? (periodChange / chartData[0]) * 100 : 0;
  const isPositive = periodChange >= 0;
  const currency = quote?.currency ?? "USD";

  const stats = useMemo(
    () => [
      ["Previous close", formatPrice(quote?.previousClose ?? null)],
      ["Open", formatPrice(quote?.open ?? null)],
      ["Day range", quote?.low != null && quote.high != null ? `${formatPrice(quote.low)} – ${formatPrice(quote.high)}` : "—"],
      ["52-week range", quote?.fiftyTwoWeekLow != null && quote.fiftyTwoWeekHigh != null ? `${formatPrice(quote.fiftyTwoWeekLow)} – ${formatPrice(quote.fiftyTwoWeekHigh)}` : "—"],
      ["Volume", formatVolume(quote?.volume ?? null)],
      ["Avg. volume", formatVolume(quote?.averageVolume ?? null)],
      ["Market cap", formatVolume(quote?.marketCap ?? null)],
      ["P/E ratio", quote?.pe != null ? quote.pe.toFixed(2) : "—"],
      ["Bid", formatPrice(quote?.bid ?? null)],
      ["Ask", formatPrice(quote?.ask ?? null)],
      ["Currency", currency],
      ["Exchange", quote?.exchangeCode || "—"],
    ],
    [currency, quote]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 border-b border-outline-variant/70 pb-4">
        <Link
          href="/markets"
          className="group flex items-center gap-2 text-xs text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <span className="rounded-md border border-outline-variant bg-surface-container-low p-1.5 transition-colors group-hover:border-primary/40">
            <ArrowLeft className="h-4 w-4" />
          </span>
          Markets
        </Link>
        <button
          onClick={() => {
            setLoadingChart(true);
            void fetchQuote();
          }}
          className="flex items-center gap-2 text-xs text-on-surface-variant transition-colors hover:text-primary"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loadingChart && "animate-spin")} />
          Refresh quote
        </button>
      </div>

      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              {quote?.exchangeCode || "Market"} · {currency}
            </span>
            <span className="h-1 w-1 rounded-full bg-outline" />
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">
              <Clock3 className="h-3 w-3" />
              {getDataFreshnessLabel(quote?.dataType ?? "real_time")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
              {quote?.companyName ?? symbol}
            </h1>
            <button
              aria-label="Save stock"
              onClick={() => setIsInWatchlist(!isInWatchlist)}
              className="text-on-surface-variant transition-colors hover:text-primary"
            >
              <Star className={cn("h-5 w-5", isInWatchlist && "fill-primary text-primary")} />
            </button>
          </div>
          <p className="mt-1 font-mono text-sm text-on-surface-variant">{symbol}</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface transition-colors hover:border-primary/40">
            <Bell className="h-4 w-4" />
            Create alert
          </button>
          <button
            onClick={() => setIsInWatchlist(!isInWatchlist)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary transition-transform active:scale-95"
          >
            <Plus className={cn("h-4 w-4 transition-transform", isInWatchlist && "rotate-45")} />
            {isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          </button>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-4xl font-semibold tracking-[-0.06em] text-on-surface md:text-5xl">
            {formatPrice(quote?.price ?? null)}
          </span>
          <span className={cn("font-mono text-lg font-semibold", (quote?.change ?? 0) >= 0 ? "text-primary" : "text-error")}>
            {formatChange(quote?.change ?? null)} ({formatPercent(quote?.changePercent ?? null)})
          </span>
          <span className="font-mono text-xs uppercase text-on-surface-variant">{currency}</span>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          As of {quote?.marketTimestamp ? new Date(quote.marketTimestamp).toLocaleString("en-CA", { hour: "numeric", minute: "2-digit", timeZoneName: "short" }) : "latest market update"}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col gap-3 border-b border-outline-variant/70 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {Object.keys(RANGE_MAP).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setLoadingChart(true);
                  setChartRange(range);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors",
                  chartRange === range
                    ? "bg-primary/15 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-on-surface-variant">{chartRange} performance</span>
            <span className={isPositive ? "text-primary" : "text-error"}>
              {periodChange >= 0 ? "+" : ""}{periodChange.toFixed(2)} ({periodChangePercent >= 0 ? "+" : ""}{periodChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="relative px-2 pb-2 pt-3 md:px-4">
          {loadingChart ? (
            <div className="flex h-[310px] items-center justify-center md:h-[390px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : chartData.length > 1 ? (
            <StockPerformanceChart
              data={chartData}
              labels={chartLabels}
              previousClose={quote?.previousClose ?? null}
              positive={isPositive}
              currency={currency}
            />
          ) : (
            <div className="flex h-[310px] items-center justify-center text-sm text-on-surface-variant md:h-[390px]">
              Chart data is unavailable for this period.
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 border-b border-outline-variant/60 py-3">
            <span className="text-xs text-on-surface-variant">{label}</span>
            <span className="text-right font-mono text-xs font-semibold text-on-surface">{value}</span>
          </div>
        ))}
      </section>

      <button className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-4 py-4 text-left transition-colors hover:border-primary/30">
        <span>
          <span className="block text-sm font-semibold text-on-surface">{quote?.companyName ?? symbol} overview</span>
          <span className="mt-0.5 block text-xs text-on-surface-variant">Company profile, valuation and trading details</span>
        </span>
        <ChevronDown className="h-4 w-4 text-on-surface-variant" />
      </button>
    </div>
  );
}
