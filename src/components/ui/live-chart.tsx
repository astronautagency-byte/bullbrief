"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { cn } from "@/lib/cn";

interface LiveChartProps {
  symbol: string;
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
  interval = 5000,
  height = 300,
  className,
  formatValue,
}: LiveChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [isPositive, setIsPositive] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPrice = async () => {
    try {
      const res = await fetch(
        `/api/markets/stock?symbol=${encodeURIComponent(symbol)}&range=1d`
      );
      const json = await res.json();

      if (json.quote?.price) {
        const newPrice = json.quote.price;
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        const label = now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

        setPreviousPrice(currentPrice);
        setCurrentPrice(newPrice);

        setData((prev) => {
          const newPoint: DataPoint = { time: timeStr, value: newPrice, label };
          const updated = [...prev, newPoint];
          if (updated.length > 120) updated.shift();
          return updated;
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchPrice();
    intervalRef.current = setInterval(fetchPrice, interval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [symbol, interval]);

  useEffect(() => {
    if (currentPrice !== null && previousPrice !== null) {
      setIsPositive(currentPrice >= previousPrice);
    }
  }, [currentPrice, previousPrice]);

  const chartData = useMemo(() => data, [data]);

  const strokeColor = isPositive ? "#12D162" : "#FF5C5C";
  const glowColor = isPositive ? "rgba(18,209,98,0.5)" : "rgba(255,92,92,0.5)";
  const fillId = useMemo(
    () => `live-fill-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const glowId = useMemo(
    () => `live-glow-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.15 || 1;

  const priceChange = currentPrice && previousPrice ? currentPrice - previousPrice : 0;
  const priceChangePercent =
    previousPrice !== 0 ? (priceChange / (previousPrice || currentPrice || 1)) * 100 : 0;

  if (chartData.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant", className)}
        style={{ height }}
      >
        <div className="text-on-surface-variant text-sm">Loading live data...</div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Live price header */}
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
                isPositive ? "text-primary" : "text-error"
              )}
            >
              {isPositive ? "+" : ""}
              {priceChange.toFixed(2)}
            </span>
            <span
              className={cn(
                "text-xs font-mono px-1.5 py-0.5 rounded",
                isPositive
                  ? "bg-primary/10 text-primary"
                  : "bg-error/10 text-error"
              )}
            >
              {isPositive ? "+" : ""}
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
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="40%" stopColor={strokeColor} stopOpacity={0.15} />
                <stop offset="80%" stopColor={strokeColor} stopOpacity={0.05} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
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
            <YAxis
              hide
              domain={[minVal - padding, maxVal + padding]}
            />

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
              animationDuration={500}
              animationEasing="ease-out"
            />

            {chartData.length > 0 && (
              <ReferenceDot
                x={chartData[chartData.length - 1].label}
                y={chartData[chartData.length - 1].value}
                r={0}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Current price dot indicator */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-on-surface"
          style={{
            backgroundColor: strokeColor,
            boxShadow: `0 0 12px ${glowColor}, 0 0 24px ${glowColor}`,
          }}
        />

        {/* Price label on right */}
        <div
          className="absolute right-2 bg-surface-container-high/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-mono border border-outline-variant/30"
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
