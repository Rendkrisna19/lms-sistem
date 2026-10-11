import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 select-none shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-500/20",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-400",
        secondary: "bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200/60",
        ghost: "hover:bg-slate-100 text-slate-700 shadow-none",
        link: "text-brand-600 underline-offset-4 hover:underline shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";
