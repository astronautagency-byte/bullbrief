"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const sizeMap = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const starSize = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;

        return (
          <div key={i} className="relative">
            <Star
              className={cn(
                starSize,
                filled
                  ? "fill-primary text-primary"
                  : half
                    ? "fill-primary/50 text-primary"
                    : "fill-outline-variant/30 text-outline-variant/50"
              )}
            />
          </div>
        );
      })}
      {showValue && (
        <span className="ml-1 text-xs font-mono text-on-surface-variant">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
