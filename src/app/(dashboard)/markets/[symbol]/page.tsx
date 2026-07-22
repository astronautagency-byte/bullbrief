"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { formatPrice, formatPercent, formatChange, formatRelativeTime, getTrendDirection, getDataFreshnessLabel, formatVolume, type Quote } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Plus, Minus, ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";

function generateHistoricalData(base: number, trend: number, points: number): number[] {
  const data: number[] = [];
  let current = base * (1 - trend * 0.05);
  for (let i = 0; i < points; i++) {
    const noise = (Math.sin(i * 0.7) * 0.015 + Math.cos(i * 1.3) * 0.01) * base;
    const drift = (trend * base * 0.001);
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
    case "5D":
      count = 65;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 60 * 60000);
      break;
    case "1M":
      count = 22;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 86400000);
      break;
    case "3M":
      count = 65;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 86400000);
      break;
    case "6M":
      count = 130;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 86400000);
      break;
    case "1Y":
      count = 252;
      stepFn = (i) => new Date(now.getTime() - (count - i) * 86400000);
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

interface StockDetailPageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol } = await params;
  return <StockDetailClient symbol={symbol.toUpperCase()} />;
}

function StockDetailClient({ symbol }: { symbol: string }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [chartRange, setChartRange] = useState("1M");

  const stockData: Record<string, {
    name: string; exchange: string; price: number; change: number;
    changePercent: number; open: number; high: number; low: number;
    previousClose: number; volume: number;
    dataType: Quote["dataType"];
  }> = {
    NVDA: { name: "NVIDIA Corp.", exchange: "NASDAQ", price: 875.3, change: 23.45, changePercent: 2.75, open: 855.0, high: 880.2, low: 852.1, previousClose: 851.85, volume: 45230000, dataType: "end_of_day" },
    AAPL: { name: "Apple Inc.", exchange: "NASDAQ", price: 189.2, change: -1.3, changePercent: -0.68, open: 190.5, high: 191.2, low: 188.5, previousClose: 190.5, volume: 52100000, dataType: "end_of_day" },
  };

  const stock = stockData[symbol] || {
    name: symbol, exchange: "NASDAQ", price: 100 + Math.random() * 200,
    change: (Math.random() - 0.5) * 10, changePercent: (Math.random() - 0.5) * 5,
    open: 100, high: 110, low: 95, previousClose: 102, volume: 10000000,
    dataType: "end_of_day" as const,
  };

  const trend = getTrendDirection(stock.change);
  const trendColor = trend === "up" ? "text-primary" : trend === "down" ? "text-error" : "text-on-surface-variant";

  const rangePoints: Record<string, number> = {
    "1D": 78, "5D": 65, "1M": 22, "3M": 65, "6M": 130, "1Y": 252,
  };

  const chartData = useMemo(() => {
    const points = rangePoints[chartRange] || 22;
    return generateHistoricalData(stock.price, stock.changePercent, points);
  }, [chartRange, stock.price, stock.changePercent]);

  const chartLabels = useMemo(() => generateLabels(chartRange), [chartRange]);

  const openPrice = chartData[0];
  const closePrice = chartData[chartData.length - 1];
  const periodChange = closePrice - openPrice;
  const periodChangePercent = (periodChange / openPrice) * 100;
  const isPeriodPositive = periodChange >= 0;

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
            <Badge>{stock.exchange}</Badge>
            <span className="text-xs text-on-surface-variant font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getDataFreshnessLabel(stock.dataType)}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm">{stock.name}</p>
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

      <div className="flex items-end gap-4">
        <span className="font-mono text-4xl font-bold text-on-surface">
          {formatPrice(stock.price)}
        </span>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("font-mono text-xl", trendColor)}>
            {formatChange(stock.change)}
          </span>
          <span className={cn("font-mono text-xl", trendColor)}>
            ({formatPercent(stock.changePercent)})
          </span>
        </div>
      </div>

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
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open", value: formatPrice(stock.open) },
          { label: "High", value: formatPrice(stock.high) },
          { label: "Low", value: formatPrice(stock.low) },
          { label: "Prev Close", value: formatPrice(stock.previousClose) },
          { label: "Volume", value: formatVolume(stock.volume) },
          { label: "Market Cap", value: "—" },
          { label: "P/E Ratio", value: "—" },
          { label: "52W Range", value: "—" },
        ].map((item) => (
          <div key={item.label} className="bg-surface-container-low border border-outline-variant rounded-lg p-3 hover:border-primary/20 transition-colors">
            <span className="text-xs text-on-surface-variant font-mono uppercase block mb-1">
              {item.label}
            </span>
            <span className="font-mono text-on-surface font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
