"use client";

import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-surface-container-low border border-outline-variant rounded-lg",
              "px-4 py-3 text-on-surface font-body",
              "placeholder:text-on-surface-variant/50",
              "focus:border-primary focus:ring-1 focus:ring-primary input-glow",
              "focus:outline-none",
              "transition-colors",
              icon && "pl-10",
              error && "border-error focus:border-error focus:ring-error",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
