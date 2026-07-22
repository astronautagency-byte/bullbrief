"use client";

import { cn } from "@/lib/cn";

interface SparklineProps {
  data: number[];
  positive?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  positive = true,
  className,
  width = 100,
  height = 30,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor = positive ? "#22c55e" : "#ef4444";
  const gradientId = `sparkline-${positive ? "pos" : "neg"}-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      className={cn("flex-shrink-0", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}
