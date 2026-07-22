import { cn } from "@/lib/cn";

type BrandLogoProps = {
  variant?: "horizontal" | "stacked" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function BrandLogo({
  variant = "horizontal",
  size = "md",
  className,
}: BrandLogoProps) {
  const src = {
    horizontal: "/BullBrief_Combo_Horizontal_Transparent.png",
    stacked: "/BullBrief_Combo_Stacked_Transparent.png",
    icon: "/BullBrief_App_Icon.png",
    wordmark: "/BullBrief_Wordmark_Transparent.png",
  }[variant];

  const alt = "BullBrief";

  const sizeClasses = {
    horizontal: { sm: "h-6", md: "h-8", lg: "h-10" },
    stacked: { sm: "h-10", md: "h-14", lg: "h-18" },
    icon: { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-10 h-10" },
    wordmark: { sm: "h-4", md: "h-6", lg: "h-8" },
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(sizeClasses[variant][size], variant === "icon" ? "rounded-lg" : "w-auto object-contain", className)}
    />
  );
}
