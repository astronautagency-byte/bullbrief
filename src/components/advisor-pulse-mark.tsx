import { cn } from "@/lib/cn";

export function AdvisorPulseMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("advisor-pulse-mark", compact && "advisor-pulse-mark-compact", className)} aria-label="AdvisorPulse by BullBrief">
      <span className="advisor-pulse-name">Advisor<span>Pulse</span></span>
      <span className="advisor-pulse-by">by BullBrief</span>
    </div>
  );
}
