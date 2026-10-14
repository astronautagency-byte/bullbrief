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
  const labelMap = {
    positive: "Positive impact",
    neutral: "Neutral impact",
    negative: "Negative impact",
  };
  const contextMap = {
    positive: "Automated analysis found a potentially supportive market signal in this article.",
    neutral: "Automated analysis found no clear positive or negative market direction in this article.",
    negative: "Automated analysis found a potentially adverse market signal in this article.",
  };
  return (
    <span title={`${contextMap[sentiment]} This is not a security rating or recommendation.`} aria-label={`${labelMap[sentiment]}. ${contextMap[sentiment]} Not a security rating or recommendation.`}>
      <Badge variant={variantMap[sentiment]} className={className}>
        {labelMap[sentiment]}
      </Badge>
    </span>
  );
}

export function NewsImpactGuide({ compact = false }: { compact?: boolean }) {
  return (
    <details className={cn("group rounded-xl border border-outline-variant bg-surface-container-low", compact ? "px-3 py-2" : "px-4 py-3")}>
      <summary className="cursor-pointer list-none text-xs font-semibold text-on-surface marker:hidden">
        About article impact labels
        <span className="ml-2 font-normal text-on-surface-variant group-open:hidden">How to read them</span>
      </summary>
      <div className="mt-3 grid gap-3 text-[11px] leading-5 text-on-surface-variant sm:grid-cols-3">
        <p><strong className="text-primary">Positive impact</strong><br />The article contains a potentially supportive market signal.</p>
        <p><strong className="text-on-surface">Neutral impact</strong><br />The article has no clear positive or negative direction.</p>
        <p><strong className="text-error">Negative impact</strong><br />The article contains a potentially adverse market signal.</p>
      </div>
      <p className="mt-3 border-t border-outline-variant pt-2 text-[10px] leading-4 text-on-surface-variant">Labels are automated summaries of the headline and available article text. They are not security ratings, predictions or trade recommendations. Review the source article before using it in client work.</p>
    </details>
  );
}
