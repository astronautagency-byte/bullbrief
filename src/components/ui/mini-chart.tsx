"use client";

import { useState, useEffect, useRef, useId, useCallback } from "react";
import {
  AreaChart,
  Area,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/cn";

interface MiniChartProps {
  symbol: string;
  positive?: boolean;
  className?: string;
}

interface DataPoint {
  time: string;
  value: number;
}

export function MiniChart({
  symbol,
  positive = true,
  className,
}: MiniChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const chartId = useId().replace(/:/g, "");

  const loadHistoricalData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/markets/history?symbol=${encodeURIComponent(symbol)}&range=1d`
      );
      const json = await res.json();

      if (json.data && json.data.length > 0 && mountedRef.current) {
        const points: DataPoint[] = json.data.map((p: { date: string; value: number }) => ({
          time: p.date,
          value: p.value,
        }));
        setData(points);
      }
    } catch {
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [symbol]);

  const pollPrice = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/markets/stock?symbol=${encodeURIComponent(symbol)}&range=1d`
      );
      const json = await res.json();

      if (json.quote?.price && mountedRef.current) {
        const newPrice = json.quote.price;

        setData((prev) => {
          if (prev.length === 0) return prev;
          const lastVal = prev[prev.length - 1].value;
          if (Math.abs(newPrice - lastVal) < 0.001) return prev;

          const now = new Date();
          const time = now.toISOString();
          const newPoint: DataPoint = { time, value: newPrice };
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
      const interval = setInterval(pollPrice, 60_000);
      return () => clearInterval(interval);
    }
  }, [isLoading, pollPrice]);

  const strokeColor = positive ? "#4BE277" : "#FF7A73";
  const glowColor = positive ? "rgba(18,209,98,0.5)" : "rgba(255,92,92,0.5)";

  const values = data.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const baseline = data[0]?.value ?? minimum;
  const splitOffset = maximum === minimum
    ? 50
    : Math.max(0, Math.min(100, ((maximum - baseline) / (maximum - minimum)) * 100));

  const fillId = `mini-fill-${chartId}`;
  const strokeId = `mini-stroke-${chartId}`;
  const glowId = `mini-glow-${chartId}`;

  if (isLoading || data.length < 2) {
    return (
      <div
        className={cn("rounded bg-surface-container-low border border-outline-variant h-10 w-full", className)}
      />
    );
  }

  return (
    <div className={cn("group/chart relative h-11 w-full min-w-20 flex-shrink-0 overflow-hidden", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id={strokeId} x1="0" x2="0" y1="0" y2="1">
              <stop offset={`${splitOffset}%`} stopColor="#4BE277" />
              <stop offset={`${splitOffset}%`} stopColor="#FF5C5C" />
            </linearGradient>
            <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="40%" stopColor={strokeColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <ReferenceLine
            y={baseline}
            stroke="rgba(158,175,167,0.34)"
            strokeDasharray="2 3"
          />
          <Area
            type="linear"
            dataKey="value"
            stroke={`url(#${strokeId})`}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={{
              r: 3,
              fill: strokeColor,
              stroke: "#0E0E12",
              strokeWidth: 1,
              style: { filter: `drop-shadow(0 0 4px ${glowColor})` },
            }}
            animationDuration={650}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      <span
        className="watchlist-live-dot pointer-events-none absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: strokeColor, boxShadow: `0 0 8px ${glowColor}` }}
      />
    </div>
  );
}
