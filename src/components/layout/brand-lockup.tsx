"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useInstitutionBrand } from "@/components/institution-brand-provider";

type BrandLockupProps = {
  compact?: boolean;
  className?: string;
  onClick?: () => void;
};

export function BrandLockup({ compact = false, className, onClick }: BrandLockupProps) {
  const { companyName, institutionLogo } = useInstitutionBrand();
  const institutionLabel = companyName || "Your financial institution";

  return (
    <Link href="/brief" className={cn("block max-w-full", className)} onClick={onClick} aria-label="BullBrief advisor workspace">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/BullBrief_Wordmark_Transparent.png" alt="BullBrief" className={cn("bullbrief-wordmark w-auto object-contain", compact ? "h-5" : "h-7")} />
      {(institutionLogo || companyName) && (
        <div className={cn("mt-2 border-t border-outline-variant pt-2", compact ? "max-w-44" : "max-w-full")}>
          {institutionLogo && (
            <div className={cn("institution-logo-frame flex w-fit items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-white", compact ? "min-h-7 max-w-28 px-1.5 py-1" : "min-h-8 max-w-32 px-2 py-1")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={institutionLogo}
                alt={`${institutionLabel} logo`}
                className={cn("w-auto max-w-full object-contain", compact ? "max-h-5" : "max-h-6")}
              />
            </div>
          )}
          {companyName && (
            <span className={cn("block truncate font-bold uppercase text-on-surface-variant", institutionLogo ? "mt-1.5" : "", compact ? "text-[9px] tracking-[0.12em]" : "text-[10px] tracking-[0.14em]")}>
              {companyName}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
