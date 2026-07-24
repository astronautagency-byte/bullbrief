import { cn } from "@/lib/cn";
import {
  getTrendDirection,
  formatPrice,
  formatPercent,
  formatChange,
  type Quote,
} from "@/lib/types";
import { MiniChart } from "./interactive-chart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceDisplayProps {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  change,
  changePercent,
  size = "md",
  showTrend = true,
  className,
}: PriceDisplayProps) {
  const trend = getTrendDirection(change ?? 0);
  const trendColor =
    trend === "up"
      ? "text-primary"
      : trend === "down"
        ? "text-error"
        : "text-on-surface-variant";

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showTrend && (
        <TrendIcon className={cn("w-4 h-4", trendColor)} />
      )}
      <span className={cn("font-mono font-medium", trendColor, sizeClasses[size])}>
        {formatPrice(price)}
      </span>
      <span className={cn("font-mono text-sm", trendColor)}>
        {formatChange(change)}
      </span>
      <span className={cn("font-mono text-sm", trendColor)}>
        {formatPercent(changePercent)}
      </span>
    </div>
  );
}

interface IndexCardProps {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparklineData?: number[];
  lastUpdated?: string;
  dataType?: Quote["dataType"];
}

export function IndexCard({
  symbol,
  name,
  value,
  change,
  changePercent,
  sparklineData,
  dataType,
}: IndexCardProps) {
  const trend = getTrendDirection(change);
  const trendColor =
    trend === "up"
      ? "text-primary"
      : trend === "down"
        ? "text-error"
        : "text-on-surface-variant";

  return (
    <div
      className={cn(
        "bg-surface-container-low border border-surface-container rounded-lg p-3",
        "hover:border-primary/30 transition-all group cursor-pointer",
        "hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-xs text-on-surface-variant font-medium">
          {symbol}
        </span>
        {dataType && (
          <span className="font-body text-[10px] text-on-surface-variant/60 uppercase">
            {dataType === "real_time" ? "Live" : dataType === "end_of_day" ? "EOD" : "Delayed"}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="font-body text-lg font-medium text-on-surface block">
            {formatPrice(value)}
          </span>
          <span className={cn("font-body text-sm", trendColor)}>
            {formatChange(change)} ({formatPercent(changePercent)})
          </span>
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <MiniChart
            data={sparklineData}
            positive={trend === "up"}
            width={80}
            height={32}
          />
        )}
      </div>
    </div>
  );
}
