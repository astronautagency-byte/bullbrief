"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
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

  return (
    <div className={cn("h-11 w-full min-w-20 overflow-hidden", className)} aria-label={`${symbol} intraday price trend`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 3, bottom: 5, left: 3 }}>
          <Line
            type="linear"
            dataKey="value"
            stroke={positive ? "#4BE277" : "#FF7A73"}
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
