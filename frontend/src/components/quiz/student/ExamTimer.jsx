import { Clock } from "lucide-react";
import { formatCountdown } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";

export function ExamTimer({ seconds }) {
  const critical = seconds <= 60;
  const warning = seconds <= 300;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-base font-bold tabular-nums",
        critical ? "border-red-300 bg-red-50 text-red-700 animate-pulse" : warning ? "border-amber-300 bg-amber-50 text-amber-800" : "border-brand-200 bg-brand-50 text-brand-700"
      )}
      role="timer"
      aria-label={`Sisa waktu ${formatCountdown(seconds)}`}
    >
      <Clock className="h-4 w-4" aria-hidden="true" />
      <span aria-hidden="true">{Number.isFinite(seconds) ? formatCountdown(seconds) : "--:--"}</span>
    </div>
  );
}
