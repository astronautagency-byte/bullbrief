"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, formatPercent, formatChange, formatRelativeTime, getTrendDirection, type Article } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  Podcast,
  Loader2,
  Globe,
  MapPin,
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

const MOCK_WATCHLIST = [
  { symbol: "AAPL", name: "Apple Inc.", price: 172.50, changePercent: 1.25 },
  { symbol: "NVDA", name: "NVIDIA Corp", price: 852.12, changePercent: 3.42 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 198.45, changePercent: -0.85 },
];

const MOCK_NEWS = [
  { category: "MACRO", title: "Fed signals potential rate cuts later this year as inflation cools", time: "12m ago" },
  { category: "TECH", title: "Semiconductor rally continues; key players announce next-gen chips", time: "45m ago" },
  { category: "EARNINGS", title: "Major retailers report mixed Q3 results amid shifting consumer habits", time: "2h ago" },
];

const MOCK_PODCAST = {
  title: "Market Opening Bell",
  source: "BullBrief Daily",
  duration: "15 min",
};

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
  const [news, setNews] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const indexes = region === "us" ? US_INDEXES : CA_INDEXES;
  const primaryIndex = indexes[0];

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
      <div>
        <h1 className="font-display font-bold text-3xl text-on-surface italic">
          Market Overview
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Live updates &middot; Last refreshed {timeStr} {tzStr}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indexes.map((idx) => {
          const TrendIcon = idx.trend === "up" ? TrendingUp : idx.trend === "down" ? TrendingDown : null;
          const trendColor = idx.trend === "up" ? "text-primary" : idx.trend === "down" ? "text-error" : "text-on-surface-variant";
          return (
            <div
              key={idx.symbol}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer",
                idx.symbol === primaryIndex.symbol
                  ? "bg-primary/5 border-primary/30"
                  : "bg-surface-container-low border-outline-variant hover:border-primary/20"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-on-surface-variant font-mono uppercase">{idx.name}</span>
                {TrendIcon && <TrendIcon className={cn("w-4 h-4", trendColor)} />}
              </div>
              <span className="font-mono text-xl font-bold text-on-surface block">
                {idx.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("font-mono text-sm", trendColor)}>
                  {idx.change >= 0 ? "+" : ""}{idx.change.toFixed(2)}
                </span>
                <span className={cn("font-mono text-xs px-1.5 py-0.5 rounded", isPositive ? "bg-primary/10 text-primary" : "bg-error/10 text-error")}>
                  {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-on-surface-variant font-mono uppercase tracking-wider">
                    Total Portfolio Value
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {region === "us" ? "US Markets" : "Canada Markets"}
                  </Badge>
                </div>
                <div className="flex items-end gap-3 mt-1">
                  <span className="font-mono text-3xl font-bold text-on-surface">
                    ${primaryIndex.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center gap-1 mb-1">
                    <span className={cn("font-mono text-sm", isPositive ? "text-primary" : "text-error")}>
                      {isPositive ? "↑" : "↓"} {Math.abs(periodChangePercent).toFixed(1)}%
                    </span>
                    <span className="text-xs text-on-surface-variant">Today</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {["1D", "1W", "1M", "1Y"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-mono transition-all",
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
              height={320}
              showGrid
              showTooltip
              showCrosshair
              formatValue={(v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-on-surface uppercase tracking-wider text-sm">
                Active Watchlist
              </h3>
              <a href="/watchlist" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                View All <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-1">
              {MOCK_WATCHLIST.map((stock) => {
                const positive = stock.changePercent >= 0;
                return (
                  <a
                    key={stock.symbol}
                    href={`/markets/${stock.symbol}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center">
                        <span className="text-[10px] font-mono font-bold text-on-surface-variant">
                          {stock.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <span className="font-mono font-medium text-on-surface block text-sm">
                          {stock.symbol}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {stock.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-on-surface text-sm block">
                        ${stock.price.toFixed(2)}
                      </span>
                      <span className={cn("font-mono text-xs px-1.5 py-0.5 rounded", positive ? "bg-primary/10 text-primary" : "bg-error/10 text-error")}>
                        {positive ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚡</span>
            <h2 className="font-display font-bold text-xl text-on-surface italic">
              The Daily Brief
            </h2>
          </div>

          <div className="space-y-3">
            {loadingNews ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : news.length > 0 ? (
              news.map((article, i) => {
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
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase", sentimentColor)}>
                        {article.sentimentLabel === "positive" ? "BULLISH" : article.sentimentLabel === "negative" ? "BEARISH" : "MARKET"}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {formatRelativeTime(article.publishedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface font-medium line-clamp-2">
                      {article.title}
                    </p>
                  </a>
                );
              })
            ) : (
              MOCK_NEWS.map((item, i) => {
                const catColor =
                  item.category === "MACRO"
                    ? "bg-primary/20 text-primary"
                    : item.category === "TECH"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-amber-500/20 text-amber-400";
                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-surface-container-low border border-outline-variant"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase", catColor)}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface font-medium line-clamp-2">
                      {item.title}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <a href="/brief">
            <Button variant="secondary" className="w-full">
              Read Full Brief
            </Button>
          </a>

          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Podcast className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-on-surface uppercase tracking-wider text-sm">
                Trending Audio
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Podcast className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {MOCK_PODCAST.title}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {MOCK_PODCAST.source} &middot; {MOCK_PODCAST.duration}
                  </p>
                </div>
                <div className="flex items-end gap-0.5 h-6">
                  {[3, 5, 4, 6, 5, 4, 3].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      style={{ height: `${h * 3}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
