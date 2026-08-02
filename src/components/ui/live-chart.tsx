"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/cn";

interface LiveChartProps {
  symbol: string;
  range?: string;
  interval?: number;
  height?: number;
  className?: string;
  formatValue?: (value: number) => string;
}

interface DataPoint {
  time: string;
  value: number;
  label: string;
}

const RANGE_MAP: Record<string, string> = { "1D": "1d", "1W": "5d", "1M": "1mo", "1Y": "1y" };

export function LiveChart({ symbol, range = "1M", interval = 60_000, height = 280, className, formatValue }: LiveChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      const apiRange = RANGE_MAP[range] || "1mo";
      const res = await fetch(`/api/markets/history?symbol=${encodeURIComponent(symbol)}&range=${apiRange}`);
      const json = await res.json();
      if (json.data?.length && mountedRef.current) {
        setData(json.data.map((point: { date: string; value: number }) => {
          const date = new Date(point.date);
          return {
            time: point.date,
            value: point.value,
            label: apiRange === "1d"
              ? date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })
              : date.toLocaleDateString("en-CA", { month: "short", day: "numeric" }),
          };
        }));
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [range, symbol]);

  useEffect(() => {
    mountedRef.current = true;
    const timer = window.setTimeout(() => void loadData(), 0);
    const refresh = window.setInterval(() => void loadData(), interval);
    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      window.clearInterval(refresh);
    };
  }, [interval, loadData]);

  const first = data[0]?.value ?? 0;
  const current = data.at(-1)?.value ?? 0;
  const change = current - first;
  const changePercent = first ? (change / first) * 100 : 0;
  const positive = change >= 0;
  const color = positive ? "#4be277" : "#ff7a73";
  const values = useMemo(() => data.map((point) => point.value), [data]);
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 1;
  const padding = Math.max((maximum - minimum) * 0.12, maximum * 0.004, 0.1);
  const displayValue = (value: number) => formatValue ? formatValue(value) : value.toLocaleString("en-CA", { maximumFractionDigits: 2 });

  if (isLoading) {
    return <div className={cn("flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface-variant", className)} style={{ height }}>Loading market data…</div>;
  }

  if (data.length < 2) {
    return <div className={cn("flex items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface-variant", className)} style={{ height }}>Chart data is unavailable.</div>;
  }

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-semibold text-on-surface">{displayValue(current)}</span>
          <span className={cn("font-mono text-sm font-medium", positive ? "text-primary" : "text-error")}>{change >= 0 ? "+" : ""}{change.toFixed(2)} ({changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%)</span>
        </div>
        <span className="text-[10px] text-on-surface-variant">{range} performance</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 10, bottom: 8, left: 0 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={64} tick={{ fill: "var(--app-fg-muted)", fontSize: 10 }} dy={7} />
            <YAxis orientation="right" axisLine={false} tickLine={false} width={54} tickCount={4} domain={[minimum - padding, maximum + padding]} tick={{ fill: "var(--app-fg-muted)", fontSize: 10 }} tickFormatter={displayValue} />
            <ReferenceLine y={first} stroke="var(--app-outline-variant)" strokeDasharray="4 5" label={{ value: "Start", position: "insideBottomLeft", fill: "var(--app-fg-muted)", fontSize: 10 }} />
            <Tooltip
              cursor={{ stroke: "var(--app-outline)", strokeWidth: 1 }}
              isAnimationActive={false}
              content={({ active, payload, label }) => active && payload?.length ? (
                <div className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 shadow-xl">
                  <p className="text-[10px] text-on-surface-variant">{label}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-on-surface">{displayValue(Number(payload[0].value))}</p>
                </div>
              ) : null}
            />
            <Line type="linear" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3.5, fill: color, stroke: "var(--app-bg)", strokeWidth: 2 }} animationDuration={450} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
