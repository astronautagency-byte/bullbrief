"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { formatRelativeTime, type Article } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import { PageHead } from "@/components/page-head";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
} from "lucide-react";

type MarketRegion = "us" | "ca";

interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
  currency: string;
}

const US_SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "^VIX"];
const CA_SYMBOLS = ["^GSPTSE", "^GSPTSE60", "CADUSD=X", "BTC-CAD"];

const RANGE_MAP: Record<string, { range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y"; label: string }> = {
  "1D": { range: "1d", label: "1D" },
  "1W": { range: "5d", label: "1W" },
  "1M": { range: "1mo", label: "1M" },
  "1Y": { range: "1y", label: "1Y" },
};

export default function MarketsPage() {
  const [region, setRegion] = useState<MarketRegion>("us");
  const [chartRange, setChartRange] = useState("1M");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [indexes, setIndexes] = useState<IndexData[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [loadingIndexes, setLoadingIndexes] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [news, setNews] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const primaryIndex = indexes[selectedIndex] ?? null;

  const fetchIndexes = useCallback(async () => {
    try {
      const res = await fetch(`/api/markets?region=${region}`);
      const json = await res.json();
      if (json.data) {
        setIndexes(json.data);
        setLastUpdated(new Date());
      }
    } catch {
      console.error("Failed to fetch indexes");
    } finally {
      setLoadingIndexes(false);
    }
  }, [region]);

  const fetchChart = useCallback(async () => {
    if (!primaryIndex) return;
    setLoadingChart(true);
    try {
      const rangeDef = RANGE_MAP[chartRange];
      const res = await fetch(`/api/markets/history?symbol=${encodeURIComponent(primaryIndex.symbol)}&range=${rangeDef.range}`);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        setChartData(json.data.map((p: { value: number }) => p.value));
        setChartLabels(json.data.map((p: { date: string }) => {
          const d = new Date(p.date);
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }));
      }
    } catch {
      console.error("Failed to fetch chart data");
    } finally {
      setLoadingChart(false);
    }
  }, [primaryIndex?.symbol, chartRange]);

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const res = await fetch("/api/news?limit=3");
      const json = await res.json();
      setNews(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
    fetchIndexes();
  }, [region, fetchIndexes]);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchIndexes();
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchIndexes]);

  const openPrice = chartData[0] ?? 0;
  const closePrice = chartData[chartData.length - 1] ?? 0;
  const periodChange = closePrice - openPrice;
  const periodChangePercent = openPrice !== 0 ? (periodChange / openPrice) * 100 : 0;
  const isPositive = periodChange >= 0;

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const tzStr = now.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop();

  return (
    <div className="space-y-6">
      <PageHead
        title="Market Overview"
        description="Real-time market data for S&P 500, NASDAQ, DOW, VIX, TSX, and more. Live index prices, charts, and financial news."
        canonical="https://bullbrief.vercel.app/markets"
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface italic">
            Market Overview
          </h1>
          <p className="text-on-surface-variant text-xs md:text-sm mt-1">
            Live updates &middot; Last refreshed {timeStr} {tzStr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchIndexes()}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4", loadingIndexes && "animate-spin")} />
          </button>
          <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant rounded-lg p-1">
            {([
              ["us", "USA"],
              ["ca", "Canada"],
            ] as const).map(([r, label]) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-mono transition-all",
                  region === r
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {loadingIndexes && indexes.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 md:p-4 rounded-xl border bg-surface-container-low border-outline-variant animate-pulse">
              <div className="h-3 w-20 bg-surface-container-high rounded mb-2" />
              <div className="h-6 w-24 bg-surface-container-high rounded mb-1" />
              <div className="h-3 w-16 bg-surface-container-high rounded" />
            </div>
          ))
        ) : (
          indexes.map((idx, i) => {
            const TrendIcon = idx.trend === "up" ? TrendingUp : idx.trend === "down" ? TrendingDown : null;
            const trendColor = idx.trend === "up" ? "text-primary" : idx.trend === "down" ? "text-error" : "text-on-surface-variant";
            const isCurrency = idx.symbol === "CADUSD=X";
            return (
              <button
                key={idx.symbol}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "p-3 md:p-4 rounded-xl border transition-all text-left",
                  i === selectedIndex
                    ? "bg-primary/5 border-primary/30"
                    : "bg-surface-container-low border-outline-variant hover:border-primary/20"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] md:text-xs text-on-surface-variant font-mono uppercase truncate">{idx.name}</span>
                  {TrendIcon && <TrendIcon className={cn("w-3 h-3 md:w-4 md:h-4 flex-shrink-0", trendColor)} />}
                </div>
                <span className="font-mono text-base md:text-xl font-bold text-on-surface block">
                  {isCurrency
                    ? idx.value.toFixed(4)
                    : idx.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="flex items-center gap-1 md:gap-2 mt-1">
                  <span className={cn("font-mono text-xs md:text-sm", trendColor)}>
                    {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)}
                  </span>
                  <span className={cn("font-mono text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 rounded", idx.changePercent >= 0 ? "bg-primary/10 text-primary" : "bg-error/10 text-error")}>
                    {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-3 md:p-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-xs md:text-sm text-on-surface-variant font-mono uppercase tracking-wider">
                    {primaryIndex?.name ?? "Loading..."}
                  </span>
                  <Badge variant="outline" className="text-[9px] md:text-[10px]">
                    {region === "us" ? "US Markets" : "Canada Markets"}
                  </Badge>
                </div>
                <div className="flex items-end gap-2 md:gap-3 mt-1">
                  <span className="font-mono text-2xl md:text-3xl font-bold text-on-surface">
                    {primaryIndex
                      ? primaryIndex.symbol === "CADUSD=X"
                        ? primaryIndex.value.toFixed(4)
                        : primaryIndex.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : "—"}
                  </span>
                  {primaryIndex && (
                    <div className="flex items-center gap-1 mb-1">
                      <span className={cn("font-mono text-xs md:text-sm", isPositive ? "text-primary" : "text-error")}>
                        {isPositive ? "↑" : "↓"} {Math.abs(periodChangePercent).toFixed(1)}%
                      </span>
                      <span className="text-[10px] md:text-xs text-on-surface-variant">Today</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {["1D", "1W", "1M", "1Y"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={cn(
                      "px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-xs font-mono transition-all",
                      chartRange === r
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                    )}
                  >
                    {r}
                  </button>
                ))}
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
                positive={isPositive}
                height={280}
                showGrid
                showTooltip
                showCrosshair
                formatValue={(v) =>
                  primaryIndex?.symbol === "CADUSD=X"
                    ? v.toFixed(4)
                    : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-on-surface-variant text-sm">
                No chart data available
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="font-display font-bold text-base md:text-lg text-on-surface italic mb-3">
              Top Stories
            </h2>

            <div className="space-y-2 md:space-y-3">
              {loadingNews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : news.length > 0 ? (
                news.map((article) => {
                  const sentimentColor =
                    article.sentimentLabel === "positive"
                      ? "bg-primary/20 text-primary"
                      : article.sentimentLabel === "negative"
                        ? "bg-error/20 text-error"
                        : "bg-surface-container-high text-on-surface-variant";
                  return (
                    <a
                      key={article.providerId}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn("px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-mono font-bold uppercase", sentimentColor)}>
                          {article.sentimentLabel === "positive" ? "BULLISH" : article.sentimentLabel === "negative" ? "BEARISH" : "MARKET"}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-on-surface-variant font-mono">
                          {formatRelativeTime(article.publishedAt)}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-on-surface font-medium line-clamp-2">
                        {article.title}
                      </p>
                    </a>
                  );
                })
              ) : (
                <p className="text-on-surface-variant text-sm text-center py-8">No news available</p>
              )}
            </div>

            <a href="/news" className="block mt-3">
              <Button variant="secondary" className="w-full" size="sm">
                View All News
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
