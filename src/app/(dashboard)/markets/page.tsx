"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import { formatRelativeTime, type Article } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";

type MarketRegion = "us" | "ca";

interface IndexData {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
}

const US_INDEXES: IndexData[] = [
  { symbol: "SPX", name: "S&P 500", value: 5432.1, change: 42.15, changePercent: 0.83, trend: "up" },
  { symbol: "IXIC", name: "NASDAQ", value: 16248.52, change: 185.20, changePercent: 1.15, trend: "up" },
  { symbol: "DJI", name: "DOW J", value: 38989.83, change: -15.42, changePercent: -0.04, trend: "down" },
  { symbol: "VIX", name: "VIX", value: 13.82, change: 0.22, changePercent: 1.62, trend: "up" },
];

const CA_INDEXES: IndexData[] = [
  { symbol: "GSPTSE", name: "S&P/TSX", value: 22156.4, change: 67.8, changePercent: 0.31, trend: "up" },
  { symbol: "GSPTSE60", name: "S&P/TSX 60", value: 1342.5, change: 8.2, changePercent: 0.61, trend: "up" },
  { symbol: "CADUSD", name: "CAD/USD", value: 0.7342, change: 0.0012, changePercent: 0.16, trend: "up" },
  { symbol: "BTC-CAD", name: "Bitcoin CAD", value: 92150.0, change: 1580.0, changePercent: 1.74, trend: "up" },
];

function generateChartData(base: number, trend: number, points: number): number[] {
  const data: number[] = [];
  let current = base * (1 - trend * 0.03);
  for (let i = 0; i < points; i++) {
    const noise = (Math.sin(i * 0.5) * 0.01 + Math.cos(i * 1.1) * 0.008) * base;
    const drift = trend * base * 0.0008;
    current += drift + noise;
    data.push(Math.round(current * 100) / 100);
  }
  return data;
}

function generateLabels(range: string): string[] {
  const now = new Date();
  const labels: string[] = [];
  let count: number;
  let stepFn: (i: number) => Date;

  switch (range) {
    case "1D":
      count = 78;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 5 * 60000);
      break;
    case "1W":
      count = 35;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 6 * 3600000);
      break;
    case "1M":
      count = 22;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 86400000);
      break;
    case "1Y":
      count = 52;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 7 * 86400000);
      break;
    default:
      count = 22;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 86400000);
  }

  for (let i = 0; i < count; i++) {
    const d = stepFn(i);
    labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  }
  return labels;
}

export default function MarketsPage() {
  const [region, setRegion] = useState<MarketRegion>("us");
  const [chartRange, setChartRange] = useState("1M");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [news, setNews] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const indexes = region === "us" ? US_INDEXES : CA_INDEXES;
  const primaryIndex = indexes[selectedIndex] ?? indexes[0];

  const chartData = useMemo(
    () => generateChartData(primaryIndex.value, primaryIndex.changePercent, chartRange === "1D" ? 78 : chartRange === "1W" ? 35 : chartRange === "1M" ? 22 : 52),
    [primaryIndex.value, primaryIndex.changePercent, chartRange]
  );

  const chartLabels = useMemo(() => generateLabels(chartRange), [chartRange]);

  const openPrice = chartData[0];
  const closePrice = chartData[chartData.length - 1];
  const periodChange = closePrice - openPrice;
  const periodChangePercent = (periodChange / openPrice) * 100;
  const isPositive = periodChange >= 0;

  useEffect(() => {
    setSelectedIndex(0);
  }, [region]);

  useEffect(() => {
    setLoadingNews(true);
    fetch("/api/news?limit=3")
      .then((r) => r.json())
      .then((json) => setNews(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingNews(false));
  }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const tzStr = now.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ").pop();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-on-surface italic">
            Market Overview
          </h1>
          <p className="text-on-surface-variant text-xs md:text-sm mt-1">
            Live updates &middot; Last refreshed {timeStr} {tzStr}
          </p>
        </div>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
        {indexes.map((idx, i) => {
          const TrendIcon = idx.trend === "up" ? TrendingUp : idx.trend === "down" ? TrendingDown : null;
          const trendColor = idx.trend === "up" ? "text-primary" : idx.trend === "down" ? "text-error" : "text-on-surface-variant";
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
                {idx.symbol === "CADUSD"
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
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-3 md:p-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-xs md:text-sm text-on-surface-variant font-mono uppercase tracking-wider">
                    {primaryIndex.name}
                  </span>
                  <Badge variant="outline" className="text-[9px] md:text-[10px]">
                    {region === "us" ? "US Markets" : "Canada Markets"}
                  </Badge>
                </div>
                <div className="flex items-end gap-2 md:gap-3 mt-1">
                  <span className="font-mono text-2xl md:text-3xl font-bold text-on-surface">
                    {primaryIndex.symbol === "CADUSD"
                      ? primaryIndex.value.toFixed(4)
                      : primaryIndex.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={cn("font-mono text-xs md:text-sm", isPositive ? "text-primary" : "text-error")}>
                      {isPositive ? "↑" : "↓"} {Math.abs(periodChangePercent).toFixed(1)}%
                    </span>
                    <span className="text-[10px] md:text-xs text-on-surface-variant">Today</span>
                  </div>
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

            <InteractiveChart
              data={chartData}
              labels={chartLabels}
              positive={isPositive}
              height={280}
              showGrid
              showTooltip
              showCrosshair
              formatValue={(v) =>
                primaryIndex.symbol === "CADUSD"
                  ? v.toFixed(4)
                  : `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            />
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
