import React from "react";
import { cn } from "../../lib/utils";

export function Progress({ value = 0, className, ...props }) {
  const percentage = Math.min(100, Math.max(0, value || 0));

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50", className)}
      {...props}
    >
      <div
        className="h-full bg-brand-600 transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
