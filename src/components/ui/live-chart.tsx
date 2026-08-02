"use client";

import { useState, useEffect, useRef, useMemo, useCallback, useId } from "react";
import {
  Area,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/cn";

interface LiveChartProps {
  symbol: string;
  range?: string;
  interval?: number;
  height?: number;
  className?: string;
  formatValue?: (v: number) => string;
}

interface DataPoint {
  time: string;
  value: number;
  label: string;
  volume: number;
}

const RANGE_MAP: Record<string, string> = {
  "1D": "1d",
  "1W": "5d",
  "1M": "1mo",
  "1Y": "1y",
};

export function LiveChart({
  symbol,
  range = "1M",
  interval = 60_000,
  height = 300,
  className,
  formatValue,
}: LiveChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const loadHistoricalData = useCallback(async () => {
    try {
      const apiRange = RANGE_MAP[range] || "1mo";
      const res = await fetch(
        `/api/markets/history?symbol=${encodeURIComponent(symbol)}&range=${apiRange}`
      );
      const json = await res.json();

      if (json.data && json.data.length > 0 && mountedRef.current) {
        const points: DataPoint[] = json.data.map((p: { date: string; value: number; volume?: number }) => {
          const d = new Date(p.date);
          return {
            time: p.date,
            value: p.value,
            volume: p.volume ?? 0,
            label: d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
          };
        });
        setData(points);
        const lastPrice = points[points.length - 1].value;
        setCurrentPrice(lastPrice);
      }
    } catch {
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [symbol, range]);

  const pollPrice = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/markets/stock?symbol=${encodeURIComponent(symbol)}&range=1d`
      );
      const json = await res.json();

      if (json.quote?.price && mountedRef.current) {
        const newPrice = json.quote.price;
        const now = new Date();

        setCurrentPrice(newPrice);

        setData((prev) => {
          if (prev.length === 0) return prev;

          const lastPoint = prev[prev.length - 1];
          const lastVal = lastPoint.value;

          if (Math.abs(newPrice - lastVal) < 0.001) return prev;

          const label = now.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          });
          const time = now.toISOString();

          const newPoint: DataPoint = { time, value: newPrice, label, volume: 0 };
          const updated = [...prev, newPoint];
          if (updated.length > 200) updated.shift();
          return updated;
        });
      }
    } catch {}
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;
    const timer = window.setTimeout(() => void loadHistoricalData(), 0);
    return () => {
      window.clearTimeout(timer);
      mountedRef.current = false;
    };
  }, [loadHistoricalData]);

  useEffect(() => {
    if (!isLoading) {
      intervalRef.current = setInterval(pollPrice, interval);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isLoading, pollPrice, interval]);

  const chartData = useMemo(() => data, [data]);

  const baselinePrice = chartData[0]?.value ?? currentPrice ?? 0;
  const strokeColor = (currentPrice ?? 0) >= baselinePrice
    ? "#12D162"
    : "#FF5C5C";

  const chartId = useId().replace(/:/g, "");
  const fillId = `live-fill-${chartId}`;

  const values = chartData.map((d) => d.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const padding = (maxVal - minVal) * 0.12 || 1;

  const priceChange = currentPrice ? currentPrice - baselinePrice : 0;
  const priceChangePercent =
    baselinePrice !== 0
      ? (priceChange / baselinePrice) * 100
      : 0;

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant",
          className
        )}
        style={{ height }}
      >
        <div className="text-on-surface-variant text-sm">
          Loading market data…
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Price header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-body text-3xl font-bold text-on-surface">
            {formatValue
              ? formatValue(currentPrice ?? 0)
              : (currentPrice ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-body text-sm font-medium",
                strokeColor === "#12D162" ? "text-primary" : "text-error"
              )}
            >
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)}
            </span>
            <span
              className={cn(
                "text-xs font-mono px-1.5 py-0.5 rounded",
                strokeColor === "#12D162"
                  ? "bg-primary/10 text-primary"
                  : "bg-error/10 text-error"
              )}
            >
              {priceChangePercent >= 0 ? "+" : ""}
              {priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-[10px] text-on-surface-variant font-mono uppercase">Latest available</span>
        </div>
      </div>

      {/* Chart */}
      <div
        className="relative rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 14, right: 56, bottom: 18, left: 14 }}
          >
            <defs>
              <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={strokeColor}
                  stopOpacity={0.35}
                />
                <stop
                  offset="40%"
                  stopColor={strokeColor}
                  stopOpacity={0.15}
                />
                <stop
                  offset="80%"
                  stopColor={strokeColor}
                  stopOpacity={0.05}
                />
                <stop
                  offset="100%"
                  stopColor={strokeColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(188,203,185,0.12)" vertical={false} strokeDasharray="3 5" />
            <XAxis dataKey="label" minTickGap={38} tick={{ fill: "#9eafa7", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="price" orientation="right" domain={[minVal - padding, maxVal + padding]} tick={{ fill: "#9eafa7", fontSize: 10 }} axisLine={false} tickLine={false} width={58} tickFormatter={(value) => formatValue ? formatValue(value) : value.toLocaleString("en-US", { maximumFractionDigits: 2 })} />
            <YAxis yAxisId="volume" hide domain={[0, "dataMax"]} />
            {chartData[0] && (
              <ReferenceLine
                yAxisId="price"
                y={chartData[0].value}
                stroke="rgba(224,232,226,0.58)"
                strokeDasharray="5 5"
                label={{ value: "Open", position: "insideTopLeft", fill: "#9eafa7", fontSize: 10 }}
              />
            )}
            {currentPrice !== null && (
              <ReferenceLine
                yAxisId="price"
                y={currentPrice}
                stroke={strokeColor}
                strokeDasharray="4 5"
                label={{
                  value: formatValue ? formatValue(currentPrice) : currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 }),
                  position: "insideTopRight",
                  fill: strokeColor,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const val = payload[0].value as number;
                return (
                  <div className="bg-surface-container-high/95 backdrop-blur-md text-on-surface px-3 py-2 rounded-lg text-xs font-mono shadow-xl shadow-black/30 border border-outline-variant/30">
                    <p className="font-semibold" style={{ color: strokeColor }}>
                      {formatValue
                        ? formatValue(val)
                        : val.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: "rgba(188,203,185,0.38)", strokeDasharray: "4 4" }}
            />

            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="rgba(188,203,185,0.32)"
              maxBarSize={5}
              isAnimationActive={false}
            />

            <Area
              yAxisId="price"
              type="linear"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${fillId})`}
              dot={false}
              activeDot={{
                r: 6,
                fill: strokeColor,
                stroke: "#0d1c2d",
                strokeWidth: 3,
              }}
              animationDuration={700}
              animationEasing="ease-out"
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>

      </div>
    </div>
  );
}
