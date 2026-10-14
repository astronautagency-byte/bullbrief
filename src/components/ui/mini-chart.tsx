"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
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

export function MiniChart({ symbol, positive = true, className }: MiniChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadHistoricalData = useCallback(async () => {
    try {
      const res = await fetch(`/api/markets/history?symbol=${encodeURIComponent(symbol)}&range=1d`);
      const json = await res.json();
      if (json.data?.length && mountedRef.current) {
        setData(json.data.map((point: { date: string; value: number }) => ({ time: point.date, value: point.value })));
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    mountedRef.current = true;
    const timer = window.setTimeout(() => void loadHistoricalData(), 0);
    const interval = window.setInterval(() => void loadHistoricalData(), 60_000);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadHistoricalData]);

  if (isLoading || data.length < 2) {
    return <div className={cn("h-10 w-full rounded bg-surface-container-high/40", className)} />;
  }

  const values = data.map((point) => point.value).filter(Number.isFinite);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const movement = maximum - minimum;
  const padding = movement > 0 ? movement * 0.12 : Math.max(Math.abs(maximum) * 0.002, 0.01);
  const domain: [number, number] = [minimum - padding, maximum + padding];

  return (
    <div className={cn("h-11 w-full min-w-20 overflow-hidden", className)} aria-label={`${symbol} intraday price trend`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 3, bottom: 5, left: 3 }}>
          <YAxis hide domain={domain} />
          <Line
            type="linear"
            dataKey="value"
            stroke={positive ? "var(--brand-primary, #4BE277)" : "#FF7A73"}
            strokeWidth={1.75}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
