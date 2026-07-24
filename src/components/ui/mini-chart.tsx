"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/cn";

interface MiniChartProps {
  symbol: string;
  positive?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

interface DataPoint {
  time: string;
  value: number;
}

export function MiniChart({
  symbol,
  positive = true,
  className,
  width = 120,
  height = 40,
}: MiniChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadHistoricalData = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/markets/history?symbol=${encodeURIComponent(symbol)}&range=1mo`
      );
      const json = await res.json();

      if (json.data && json.data.length > 0 && mountedRef.current) {
        const points: DataPoint[] = json.data.map((p: { date: string; value: number }) => ({
          time: p.date,
          value: p.value,
        }));
        setData(points);
        setCurrentPrice(points[points.length - 1].value);
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
        setCurrentPrice(newPrice);

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
    loadHistoricalData();
    return () => { mountedRef.current = false; };
  }, [loadHistoricalData]);

  useEffect(() => {
    if (!isLoading) {
      const interval = setInterval(pollPrice, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading, pollPrice]);

  const strokeColor = positive ? "#12D162" : "#FF5C5C";
  const glowColor = positive ? "rgba(18,209,98,0.5)" : "rgba(255,92,92,0.5)";

  const fillId = useMemo(
    () => `mini-fill-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const glowId = useMemo(
    () => `mini-glow-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  if (isLoading || data.length < 2) {
    return (
      <div
        className={cn("rounded bg-surface-container-low border border-outline-variant", className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <div className={cn("relative flex-shrink-0", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
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
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            dot={false}
            activeDot={false}
            animationDuration={300}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Current price dot */}
      <div
        className="absolute right-0 w-1.5 h-1.5 rounded-full border border-on-surface z-10"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: strokeColor,
          boxShadow: `0 0 6px ${glowColor}, 0 0 12px ${glowColor}`,
        }}
      />
    </div>
  );
}
