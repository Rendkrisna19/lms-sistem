import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-600 text-white",
        secondary: "border-transparent bg-brand-100 text-brand-800",
        destructive: "border-transparent bg-red-100 text-red-700",
        outline: "text-slate-700 border-slate-300",
        success: "border-transparent bg-emerald-100 text-emerald-800",
        warning: "border-transparent bg-amber-100 text-amber-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
