"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
}

export function LiveChart({
  symbol,
  range = "1M",
  interval = 3000,
  height = 300,
  className,
  formatValue,
}: LiveChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const RANGE_MAP: Record<string, string> = {
    "1D": "1d",
    "1W": "5d",
    "1M": "1mo",
    "1Y": "1y",
  };

  const loadHistoricalData = useCallback(async () => {
    try {
      const apiRange = RANGE_MAP[range] || "1mo";
      const res = await fetch(
        `/api/markets/history?symbol=${encodeURIComponent(symbol)}&range=${apiRange}`
      );
      const json = await res.json();

      if (json.data && json.data.length > 0 && mountedRef.current) {
        const points: DataPoint[] = json.data.map((p: { date: string; value: number }) => {
          const d = new Date(p.date);
          return {
            time: p.date,
            value: p.value,
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

        setPrevPrice((prev) => {
          if (prev === null) return currentPrice;
          return prev;
        });
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

          const newPoint: DataPoint = { time, value: newPrice, label };
          const updated = [...prev, newPoint];
          if (updated.length > 200) updated.shift();
          return updated;
        });
      }
    } catch {}
  }, [symbol, currentPrice]);

  useEffect(() => {
    mountedRef.current = true;
    loadHistoricalData();
    return () => {
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

  const strokeColor = (currentPrice ?? 0) >= (prevPrice ?? currentPrice ?? 0)
    ? "#12D162"
    : "#FF5C5C";
  const glowColor = strokeColor === "#12D162"
    ? "rgba(18,209,98,0.5)"
    : "rgba(255,92,92,0.5)";

  const fillId = useMemo(
    () => `live-fill-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const glowId = useMemo(
    () => `live-glow-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const values = chartData.map((d) => d.value);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 1;
  const padding = (maxVal - minVal) * 0.12 || 1;

  const priceChange = currentPrice && prevPrice ? currentPrice - prevPrice : 0;
  const priceChangePercent =
    prevPrice && prevPrice !== 0
      ? (priceChange / prevPrice) * 100
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
          Loading live data...
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
          <span className="text-[10px] text-on-surface-variant font-mono uppercase">
            Live
          </span>
        </div>
      </div>

      {/* Chart */}
      <div
        className="relative rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
              <filter id={glowId}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <XAxis dataKey="label" hide />
            <YAxis hide domain={[minVal - padding, maxVal + padding]} />

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
              cursor={false}
            />

            <Area
              type="monotone"
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
                filter: `url(#${glowId})`,
              }}
              animationDuration={300}
              animationEasing="ease-out"
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Current price dot */}
        <div
          className="absolute right-2 w-3 h-3 rounded-full border-2 border-on-surface z-10"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            backgroundColor: strokeColor,
            boxShadow: `0 0 12px ${glowColor}, 0 0 24px ${glowColor}`,
          }}
        />

        {/* Price label */}
        <div
          className="absolute right-2 bg-surface-container-high/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono border border-outline-variant/30 z-10"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            color: strokeColor,
          }}
        >
          {formatValue
            ? formatValue(currentPrice ?? 0)
            : (currentPrice ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
        </div>
      </div>
    </div>
  );
}
