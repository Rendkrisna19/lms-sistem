import { cn } from "../../lib/utils";
import { Skeleton } from "./skeleton";

const tones = {
  slate: "bg-slate-100 text-slate-600",
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  indigo: "bg-indigo-50 text-indigo-600",
  red: "bg-red-50 text-red-600",
};

/** Kartu angka ringkasan (KPI). `value` null/undefined ditampilkan sebagai "–". */
export function StatCard({ label, value, suffix, icon: Icon, tone = "brand", isLoading, hint, className }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {Icon && (
          <span className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", tones[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{value ?? "–"}</span>
          {suffix && value !== null && value !== undefined && <span className="text-xs text-slate-400">{suffix}</span>}
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
