import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

/** <select> bawaan browser dengan gaya seragam (aksesibel & mendukung keyboard). */
export const NativeSelect = React.forwardRef(({ className, options = [], children, ...props }, ref) => (
  <div className={cn("relative", className)}>
    <select
      ref={ref}
      className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-3 pr-9 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 disabled:opacity-50"
      {...props}
    >
      {children ??
        options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
  </div>
));
NativeSelect.displayName = "NativeSelect";
