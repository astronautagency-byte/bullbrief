"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, formatPercent, formatChange, formatVolume, getTrendDirection, getDataFreshnessLabel, type Quote } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Plus, Minus, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const RANGE_MAP: Record<string, { range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y"; label: string }> = {
  "1D": { range: "1d", label: "1D" },
  "5D": { range: "5d", label: "5D" },
  "1M": { range: "1mo", label: "1M" },
  "3M": { range: "3mo", label: "3M" },
  "6M": { range: "6mo", label: "6M" },
  "1Y": { range: "1y", label: "1Y" },
};

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = await params;
  return <StockDetailClient symbol={symbol.toUpperCase()} />;
}

function StockDetailClient({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartRange, setChartRange] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/markets/stock?symbol=${encodeURIComponent(symbol)}&range=${RANGE_MAP[chartRange]?.range ?? "1mo"}`);
      const json = await res.json();
      if (json.quote) {
        setQuote(json.quote);
      }
      if (json.history && json.history.length > 0) {
        setChartData(json.history.map((p: { value: number }) => p.value));
        setChartLabels(json.history.map((p: { date: string }) => {
          const d = new Date(p.date);
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }));
      }
    } catch {
      console.error("Failed to fetch stock data");
    } finally {
      setLoading(false);
      setLoadingChart(false);
    }
  }, [symbol, chartRange]);

  useEffect(() => {
    setLoading(true);
    setLoadingChart(true);
    fetchQuote();
  }, [fetchQuote]);

  const trend = quote ? getTrendDirection(quote.change) : "flat";
  const trendColor = trend === "up" ? "text-primary" : trend === "down" ? "text-error" : "text-on-surface-variant";

  const openPrice = chartData[0] ?? 0;
  const closePrice = chartData[chartData.length - 1] ?? 0;
  const periodChange = closePrice - openPrice;
  const periodChangePercent = openPrice !== 0 ? (periodChange / openPrice) * 100 : 0;
  const isPeriodPositive = periodChange >= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/markets" className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-2xl text-on-surface italic">
              {symbol}
            </h1>
            {quote?.exchangeCode && <Badge>{quote.exchangeCode}</Badge>}
            <span className="text-xs text-on-surface-variant font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getDataFreshnessLabel(quote?.dataType ?? "real_time")}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm">{quote?.companyName ?? symbol}</p>
        </div>
        <Button
          variant={isInWatchlist ? "secondary" : "primary"}
          size="sm"
          onClick={() => setIsInWatchlist(!isInWatchlist)}
        >
          {isInWatchlist ? (
            <><Minus className="w-4 h-4" /> Remove</>
          ) : (
            <><Plus className="w-4 h-4" /> Add to watchlist</>
          )}
        </Button>
      </div>

      {quote && (
        <div className="flex items-end gap-4">
          <span className="font-body text-4xl font-bold text-on-surface">
            {formatPrice(quote.price ?? 0)}
          </span>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("font-body text-xl", trendColor)}>
              {formatChange(quote.change ?? 0)}
            </span>
            <span className={cn("font-body text-xl", trendColor)}>
              ({formatPercent(quote.changePercent ?? 0)})
            </span>
          </div>
        </div>
      )}

      <Card className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-variant font-mono">
              {chartRange} Performance
            </span>
            <span className={cn("text-sm font-mono", isPeriodPositive ? "text-primary" : "text-error")}>
              {isPeriodPositive ? "+" : ""}{periodChange.toFixed(2)} ({isPeriodPositive ? "+" : ""}{periodChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {loadingChart ? (
          <div className="flex items-center justify-center h-[280px]">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <InteractiveChart
            data={chartData}
            labels={chartLabels}
            positive={isPeriodPositive}
            height={280}
            showGrid
            showTooltip
            showCrosshair
            rangeSelector
            activeRange={chartRange}
            onRangeChange={setChartRange}
            formatValue={(v) => `$${v.toFixed(2)}`}
          />
        ) : (
          <div className="flex items-center justify-center h-[280px] text-on-surface-variant text-sm">
            No chart data available
          </div>
        )}
      </Card>

      {quote && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Open", value: formatPrice(quote.open ?? 0) },
            { label: "High", value: formatPrice(quote.high ?? 0) },
            { label: "Low", value: formatPrice(quote.low ?? 0) },
            { label: "Prev Close", value: formatPrice(quote.previousClose ?? 0) },
            { label: "Volume", value: formatVolume(quote.volume ?? 0) },
            { label: "Market Cap", value: "—" },
            { label: "P/E Ratio", value: "—" },
            { label: "52W Range", value: "—" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-container-low border border-outline-variant rounded-lg p-3 hover:border-primary/20 transition-colors">
              <span className="text-xs text-on-surface-variant font-mono uppercase block mb-1">
                {item.label}
              </span>
              <span className="font-body text-on-surface font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
