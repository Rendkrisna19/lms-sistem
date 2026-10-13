import { CheckCircle2, CloudOff, Loader2, RotateCw } from "lucide-react";
import { cn } from "../../../lib/utils";

/** Status penyimpanan otomatis jawaban. */
export function SaveIndicator({ status, savedAt }) {
  const time = savedAt ? savedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : null;

  const content = {
    idle: { icon: CheckCircle2, text: "Jawaban disimpan otomatis", tone: "text-slate-500" },
    saving: { icon: Loader2, text: "Menyimpan jawaban…", tone: "text-brand-700", spin: true },
    saved: { icon: CheckCircle2, text: `Tersimpan ${time ?? ""}`, tone: "text-emerald-700" },
    error: { icon: RotateCw, text: "Gagal menyimpan, mencoba lagi…", tone: "text-amber-700" },
    offline: { icon: CloudOff, text: "Offline — jawaban aman di perangkat", tone: "text-amber-700" },
  }[status] ?? { icon: CheckCircle2, text: "", tone: "" };

  const Icon = content.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", content.tone)} role="status" aria-live="polite">
      <Icon className={cn("h-3.5 w-3.5", content.spin && "animate-spin")} aria-hidden="true" />
      {content.text}
    </span>
  );
}
