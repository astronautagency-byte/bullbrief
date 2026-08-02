"use client";

import { useId, useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StockPerformanceChartProps = {
  data: number[];
  labels: string[];
  volumes?: number[];
  previousClose: number | null;
  positive: boolean;
  currency: string;
};

function PriceTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-high/95 px-3 py-2 shadow-2xl backdrop-blur">
      <p className="mb-1 text-[10px] text-on-surface-variant">{label}</p>
      <p className="font-mono text-sm font-semibold text-on-surface">
        {payload[0].value.toLocaleString("en-CA", {
          style: "currency",
          currency,
        })}
      </p>
    </div>
  );
}

export function StockPerformanceChart({
  data,
  labels,
  volumes = [],
  previousClose,
  positive,
  currency,
}: StockPerformanceChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const [activeValue, setActiveValue] = useState<number | null>(null);
  const points = useMemo(
    () => data.map((value, index) => ({ label: labels[index], value, volume: volumes[index] ?? 0 })),
    [data, labels, volumes]
  );
  const color = positive ? "#4be277" : "#ff7a73";
  const minimum = Math.min(...data, previousClose ?? Number.POSITIVE_INFINITY);
  const maximum = Math.max(...data, previousClose ?? Number.NEGATIVE_INFINITY);
  const padding = Math.max((maximum - minimum) * 0.14, maximum * 0.005);

  return (
    <div className="relative h-[310px] w-full md:h-[390px]">
      {activeValue !== null && (
        <div className="pointer-events-none absolute right-14 top-2 z-10 rounded-md border border-outline-variant bg-surface-container-high px-2 py-1 font-mono text-xs text-on-surface shadow-lg">
          {activeValue.toLocaleString("en-CA", {
            style: "currency",
            currency,
          })}
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
          margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
          onMouseMove={(state) => {
            const index = Number(state.activeTooltipIndex);
            const value = Number.isInteger(index) ? points[index]?.value : null;
            setActiveValue(typeof value === "number" ? value : null);
          }}
          onMouseLeave={() => setActiveValue(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="78%" stopColor={color} stopOpacity={0.04} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="rgba(134,149,133,0.18)"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={64}
            tick={{ fill: "var(--app-fg-muted)", fontSize: 10 }}
            dy={8}
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            axisLine={false}
            tickLine={false}
            width={54}
            domain={[minimum - padding, maximum + padding]}
            tick={{ fill: "var(--app-fg-muted)", fontSize: 10 }}
            tickFormatter={(value) => Number(value).toFixed(2)}
          />
          <YAxis yAxisId="volume" hide domain={[0, "dataMax"]} />
          {previousClose !== null && (
            <ReferenceLine
              y={previousClose}
              yAxisId="price"
              stroke="rgba(188,203,185,0.55)"
              strokeDasharray="5 5"
              label={{
                value: `Prev ${previousClose.toFixed(2)}`,
                position: "insideBottomLeft",
                fill: "var(--app-fg-muted)",
                fontSize: 10,
              }}
            />
          )}
          <Tooltip
            content={<PriceTooltip currency={currency} />}
            cursor={{
              stroke: "rgba(212,228,250,0.3)",
              strokeDasharray: "3 3",
            }}
            isAnimationActive={false}
          />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="rgba(188,203,185,0.34)"
            maxBarSize={5}
            isAnimationActive={false}
          />
          <Area
            yAxisId="price"
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={1.7}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: color,
              stroke: "var(--app-bg)",
              strokeWidth: 2,
            }}
            animationDuration={700}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
