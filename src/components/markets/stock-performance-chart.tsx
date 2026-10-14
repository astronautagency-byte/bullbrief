"use client";

import { useMemo } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type StockPerformanceChartProps = {
  data: number[];
  labels: string[];
  volumes?: number[];
  previousClose: number | null;
  positive: boolean;
  currency: string;
};

function PriceTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 shadow-xl">
      <p className="text-[10px] text-on-surface-variant">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-on-surface">
        {payload[0].value.toLocaleString("en-CA", { style: "currency", currency })}
      </p>
    </div>
  );
}

export function StockPerformanceChart({ data, labels, previousClose, positive, currency }: StockPerformanceChartProps) {
  const points = useMemo(() => data.map((value, index) => ({ label: labels[index], value })), [data, labels]);
  const color = positive ? "var(--brand-primary, #4be277)" : "#ff7a73";
  const minimum = Math.min(...data, previousClose ?? Number.POSITIVE_INFINITY);
  const maximum = Math.max(...data, previousClose ?? Number.NEGATIVE_INFINITY);
  const padding = Math.max((maximum - minimum) * 0.12, maximum * 0.004);

  return (
    <div className="h-[250px] w-full md:h-[300px]" aria-label="Stock price performance">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 16, right: 10, bottom: 4, left: 0 }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={72} tick={{ fill: "var(--app-fg-muted)", fontSize: 10 }} dy={8} />
          <YAxis orientation="right" axisLine={false} tickLine={false} width={52} tickCount={4} domain={[minimum - padding, maximum + padding]} tick={{ fill: "var(--app-fg-muted)", fontSize: 10 }} tickFormatter={(value) => Number(value).toFixed(2)} />
          {previousClose !== null && (
            <ReferenceLine y={previousClose} stroke="var(--app-outline-variant)" strokeDasharray="4 5" label={{ value: "Previous close", position: "insideBottomLeft", fill: "var(--app-fg-muted)", fontSize: 10 }} />
          )}
          <Tooltip content={<PriceTooltip currency={currency} />} cursor={{ stroke: "var(--app-outline)", strokeWidth: 1 }} isAnimationActive={false} />
          <Line type="linear" dataKey="value" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 3.5, fill: color, stroke: "var(--app-bg)", strokeWidth: 2 }} animationDuration={450} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
