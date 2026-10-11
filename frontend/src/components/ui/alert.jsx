import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const alertVariants = cva("relative flex gap-3 rounded-2xl border p-4 text-sm", {
  variants: {
    variant: {
      info: "border-brand-200 bg-brand-50/70 text-brand-900",
      success: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
      warning: "border-amber-200 bg-amber-50/80 text-amber-900",
      danger: "border-red-200 bg-red-50/80 text-red-900",
    },
  },
  defaultVariants: { variant: "info" },
});

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const iconColors = {
  info: "text-brand-600",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
};

/**
 * Pesan peringatan / informasi di dalam halaman (bukan toast).
 */
export function Alert({ variant = "info", title, children, action, onDismiss, className, icon }) {
  const Icon = icon ?? icons[variant];

  return (
    <div role={variant === "danger" ? "alert" : "status"} className={cn(alertVariants({ variant }), className)}>
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconColors[variant])} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold leading-snug">{title}</p>}
        {children && <div className="text-[13px] leading-relaxed opacity-90">{children}</div>}
        {action && <div className="pt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/5"
          aria-label="Tutup pesan"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
