import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export const QUIZ_STATUS = {
  active: { label: "Aktif", variant: "success", dot: "bg-emerald-500 animate-pulse" },
  upcoming: { label: "Terjadwal", variant: "indigo", dot: "bg-indigo-500" },
  closed: { label: "Ditutup", variant: "warning", dot: "bg-amber-500" },
  inactive: { label: "Draf / Nonaktif", variant: "muted", dot: "bg-slate-400" },
};

export const QUIZ_STATUS_FILTERS = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "upcoming", label: "Terjadwal" },
  { value: "closed", label: "Ditutup" },
  { value: "inactive", label: "Draf / Nonaktif" },
];

export function QuizStatusBadge({ status, className }) {
  const meta = QUIZ_STATUS[status] ?? QUIZ_STATUS.inactive;
  return (
    <Badge variant={meta.variant} className={cn("font-semibold", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
