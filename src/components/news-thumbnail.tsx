"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

interface NewsThumbnailProps {
  src: string | null;
  alt?: string;
  className?: string;
}

export function NewsThumbnail({ src, alt = "", className }: NewsThumbnailProps) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={alt} loading="lazy" className={cn("h-full w-full object-cover", className)} onError={() => setFailed(true)} />;
  }
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-[#172019]", className)} aria-label="BullBrief default news thumbnail">
      <img src="/BullBrief_Logo_Mark_Transparent.png" alt="BullBrief" className="h-1/2 w-1/2 object-contain" />
    </div>
  );
}
