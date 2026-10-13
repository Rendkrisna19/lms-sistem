import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight, Pencil, Trash2, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button, buttonVariants } from "../ui/button";
import { Progress } from "../ui/progress";
import { ASSIGNMENT_STATE, deadlineTone } from "../../features/assignments/deadline";
import { formatDateTime } from "../../lib/datetime";
import { cn } from "../../lib/utils";

/** Kartu penugasan di daftar guru: status, tenggat, dan progres pengumpulan kelas. */
export function AssignmentTeacherCard({ assignment, onEdit, onDelete, isEditing }) {
  const state = ASSIGNMENT_STATE[assignment.status_state] ?? ASSIGNMENT_STATE.closed;
  const total = assignment.student_count || 0;
  const submitted = assignment.submitted_count || 0;
  const tone = deadlineTone(assignment.due_at);

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <Badge variant="outline" className="max-w-full truncate border-brand-200 bg-brand-50 text-brand-700">
            {assignment.course?.title ?? "Mata pelajaran"}
          </Badge>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900">{assignment.title}</h3>
          <p className="text-xs text-slate-500">
            Kelas {assignment.classroom?.name ?? "-"} <span className="font-mono">({assignment.classroom?.code})</span>
          </p>
        </div>
        <Badge variant={state.variant} className="shrink-0">
          {state.label}
        </Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tenggat</p>
          <p className={cn("mt-1 flex items-center gap-1.5 text-xs font-semibold", tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-700" : "text-slate-800")}>
            <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formatDateTime(assignment.due_at)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nilai maksimal</p>
          <p className="mt-1 text-xs font-semibold text-slate-800">{assignment.max_score}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {submitted} dari {total} siswa mengumpulkan
          </span>
          <span className="font-semibold text-slate-800 tabular-nums">
            {assignment.graded_count} dinilai
            {assignment.late_count > 0 && <span className="text-amber-700"> · {assignment.late_count} terlambat</span>}
          </span>
        </div>
        <Progress value={total ? (submitted / total) * 100 : 0} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        <Link to={`/tugas/${assignment.id}`} className={cn(buttonVariants({ size: "sm" }), "flex-1 justify-center")}>
          Lihat pengumpulan
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        <Button size="sm" variant="outline" onClick={() => onEdit(assignment)} isLoading={isEditing} aria-label="Ubah penugasan">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(assignment)} aria-label="Hapus penugasan">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
