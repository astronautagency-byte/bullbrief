"use client";

import { useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { cn } from "@/lib/cn";

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface InteractiveChartProps {
  data: number[];
  labels?: string[];
  positive?: boolean;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showCrosshair?: boolean;
  rangeSelector?: boolean;
  onRangeChange?: (range: string) => void;
  activeRange?: string;
  className?: string;
  formatValue?: (v: number) => string;
  formatLabel?: (label: string) => string;
}

const RANGES = ["1D", "5D", "1M", "3M", "6M", "1Y"];

function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
  formatLabel,
  positive,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatValue?: (v: number) => string;
  formatLabel?: (l: string) => string;
  positive: boolean;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const color = positive ? "#12D162" : "#FF5C5C";

  return (
    <div className="bg-surface-container-high/95 backdrop-blur-md text-on-surface px-3 py-2 rounded-lg text-xs font-mono shadow-xl shadow-black/30 border border-outline-variant/30">
      {label && (
        <p className="text-on-surface-variant/70 mb-0.5">
          {formatLabel ? formatLabel(label) : label}
        </p>
      )}
      <p className="font-semibold" style={{ color }}>
        {formatValue ? formatValue(value) : value.toFixed(2)}
      </p>
    </div>
  );
}

export function InteractiveChart({
  data,
  labels,
  positive = true,
  height = 200,
  showGrid = false,
  showTooltip = true,
  showCrosshair = true,
  rangeSelector = false,
  onRangeChange,
  activeRange,
  className,
  formatValue,
  formatLabel,
}: InteractiveChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data.map((value, i) => ({
      date: labels?.[i] ?? String(i),
      value,
    }));
  }, [data, labels]);

  const strokeColor = positive ? "#12D162" : "#FF5C5C";
  const glowColor = positive ? "rgba(18,209,98,0.4)" : "rgba(255,92,92,0.4)";
  const fillId = useMemo(
    () => `chart-fill-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const glowId = useMemo(
    () => `chart-glow-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const padding = (maxVal - minVal) * 0.12 || 1;

  const handleMouseMove = useCallback(
    (e: any) => {
      if (e?.activeTooltipIndex !== undefined) {
        setHoverIndex(e.activeTooltipIndex);
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  if (data.length < 2) return null;

  return (
    <div className={cn("relative", className)}>
      {rangeSelector && (
        <div className="flex items-center gap-1 mb-3">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange?.(r)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-200",
                activeRange === r
                  ? "bg-primary/20 text-primary border border-primary/40 shadow-sm shadow-primary/10"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative rounded-xl overflow-hidden"
        style={{ height }}
        onMouseLeave={handleMouseLeave}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            onMouseMove={handleMouseMove}
          >
            <defs>
              <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="40%" stopColor={strokeColor} stopOpacity={0.12} />
                <stop offset="80%" stopColor={strokeColor} stopOpacity={0.03} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
              <filter id={glowId}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {showGrid && (
              <>
                {[0.25, 0.5, 0.75].map((ratio) => (
                  <ReferenceLine
                    key={ratio}
                    y={minVal + (maxVal - minVal) * ratio}
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="6 4"
                  />
                ))}
              </>
            )}

            <XAxis dataKey="date" hide />
            <YAxis hide domain={[minVal - padding, maxVal + padding]} />

            {showTooltip && (
              <Tooltip
                content={
                  <CustomTooltip
                    formatValue={formatValue}
                    formatLabel={formatLabel}
                    positive={positive}
                  />
                }
                cursor={
                  showCrosshair
                    ? {
                        stroke: "rgba(255,255,255,0.1)",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }
                    : false
                }
                isAnimationActive={false}
              />
            )}

            {showCrosshair && hoverIndex !== null && (
              <ReferenceLine
                x={chartData[hoverIndex]?.date}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
              />
            )}

            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${fillId})`}
              dot={false}
              activeDot={
                showCrosshair
                  ? {
                      r: 5,
                      fill: strokeColor,
                      stroke: "#0d1c2d",
                      strokeWidth: 2,
                      filter: `url(#${glowId})`,
                    }
                  : false
              }
              isAnimationActive={false}
            />

            {showCrosshair && hoverIndex !== null && chartData[hoverIndex] && (
              <ReferenceDot
                x={chartData[hoverIndex].date}
                y={chartData[hoverIndex].value}
                r={0}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {showCrosshair && hoverIndex !== null && chartData[hoverIndex] && (
          <div
            className="absolute top-3 right-4 bg-surface-container-high/95 backdrop-blur-md text-on-surface px-2.5 py-1 rounded-lg text-xs font-mono pointer-events-none z-10 shadow-lg shadow-black/20 border border-outline-variant/20"
          >
            {formatValue
              ? formatValue(chartData[hoverIndex].value)
              : chartData[hoverIndex].value.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}

interface MiniChartProps {
  data: number[];
  positive?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export function MiniChart({
  data,
  positive = true,
  width = 80,
  height = 32,
  className,
}: MiniChartProps) {
  const [hovered, setHovered] = useState(false);
  const [tooltipVal, setTooltipVal] = useState<number | null>(null);

  const chartData = useMemo(
    () => data.map((v, i) => ({ i, v })),
    [data]
  );

  const strokeColor = positive ? "#12D162" : "#FF5C5C";
  const glowColor = positive ? "rgba(18,209,98,0.5)" : "rgba(255,92,92,0.5)";
  const fillId = useMemo(
    () => `mini-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const glowId = useMemo(
    () => `mini-glow-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  if (data.length < 2) return null;

  return (
    <div
      className={cn("relative flex-shrink-0 rounded-md overflow-hidden", className)}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setTooltipVal(null);
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 3, right: 0, bottom: 3, left: 0 }}
          onMouseMove={(e: any) => {
            if (e?.activePayload?.[0]) {
              setTooltipVal(e.activePayload[0].payload.v);
            }
          }}
          onMouseLeave={() => setTooltipVal(null)}
        >
          <defs>
            <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={hovered ? 0.35 : 0.2} />
              <stop offset="60%" stopColor={strokeColor} stopOpacity={hovered ? 0.12 : 0.05} />
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
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            content={() => null}
            cursor={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={hovered ? 2 : 1.5}
            fill={`url(#${fillId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* End dot indicator */}
      <div
        className="absolute rounded-full"
        style={{
          width: 4,
          height: 4,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: strokeColor,
          boxShadow: `0 0 6px ${glowColor}`,
        }}
      />

      {hovered && tooltipVal !== null && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-container-high/95 backdrop-blur-md text-on-surface px-1.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap pointer-events-none z-10 shadow-lg shadow-black/20 border border-outline-variant/20">
          {tooltipVal.toFixed(2)}
        </div>
      )}
    </div>
  );
}
