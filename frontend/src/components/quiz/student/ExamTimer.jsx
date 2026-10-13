import { Timer } from "lucide-react";
import { formatCountdown } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";

/** Sisa waktu ujian. Warna berubah saat tersisa 5 menit dan 1 menit. */
export function ExamTimer({ seconds }) {
  const critical = seconds <= 60;
  const warning = seconds <= 300;
  const label = Number.isFinite(seconds) ? formatCountdown(seconds) : "--:--";

  return (
    <div
      role="timer"
      aria-label={`Sisa waktu ${label}`}
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border px-4 py-2 transition-colors",
        critical && "border-red-300 bg-red-50 text-red-700",
        !critical && warning && "border-amber-300 bg-amber-50 text-amber-800",
        !critical && !warning && "border-brand-200 bg-brand-50 text-brand-700"
      )}
    >
      <Timer className={cn("h-4 w-4 shrink-0", critical && "animate-pulse")} aria-hidden="true" />
      <div className="leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Sisa waktu</p>
        <p className="font-mono text-lg font-extrabold tabular-nums" aria-hidden="true">
          {label}
        </p>
      </div>
    </div>
  );
}
