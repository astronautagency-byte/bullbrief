import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "positive" | "negative" | "warning" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-container-high text-on-surface-variant",
  positive: "bg-primary/10 text-primary",
  negative: "bg-error/10 text-error",
  warning: "bg-warning/10 text-warning",
  outline: "border border-outline-variant text-on-surface-variant",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface SentimentBadgeProps {
  sentiment: "positive" | "neutral" | "negative" | null;
  className?: string;
}

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  if (!sentiment) return null;
  const variantMap = {
    positive: "positive" as const,
    neutral: "default" as const,
    negative: "negative" as const,
  };
  return (
    <Badge variant={variantMap[sentiment]} className={className}>
      {sentiment}
    </Badge>
  );
}
