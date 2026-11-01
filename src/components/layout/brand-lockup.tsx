"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { cn } from "@/lib/cn";
import { useInstitutionBrand } from "@/components/institution-brand-provider";

type BrandLockupProps = {
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
};

export function BrandLockup({ compact = false, iconOnly=false, className, onClick }: BrandLockupProps) {
  const { companyName, institutionLogo } = useInstitutionBrand();
  const institutionLabel = companyName || "Your financial institution";

  return (
    <Link href="/cockpit" className={cn("block max-w-full", className)} onClick={onClick} aria-label="BullBrief advisor workspace">
      <BrandLogo variant={iconOnly?"icon":"wordmark"} size={iconOnly?"md":compact?"sm":"md"}/>
      {!iconOnly && (institutionLogo || companyName) && (
        <div className={cn("mt-2 border-t border-outline-variant pt-2", compact ? "max-w-44" : "max-w-full")}>
          {institutionLogo && (
            <div className={cn("institution-logo-frame flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-white", compact ? "h-8 w-28 px-2 py-1" : "h-9 w-32 px-2.5 py-1.5")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={institutionLogo}
                alt={`${institutionLabel} logo`}
                className="block h-full w-full object-contain"
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
