import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight, Hourglass, UserRound } from "lucide-react";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { SUBMISSION_STATE, deadlineTone, timeUntil } from "../../features/assignments/deadline";
import { formatDateTime } from "../../lib/datetime";
import { cn } from "../../lib/utils";

/** Kartu tugas di daftar siswa: tenggat (dengan sisa waktu) dan status pengumpulan. */
export function AssignmentStudentCard({ assignment, now }) {
  const stateKey = assignment.submission ? assignment.submission.state : "none";
  const submissionState = SUBMISSION_STATE[stateKey];
  const remaining = timeUntil(assignment.due_at, now);
  const tone = deadlineTone(assignment.due_at, now);
  const isGraded = assignment.submission?.state === "graded";
  const closed = assignment.status_state === "closed" || assignment.status_state === "inactive";

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <Badge variant="outline" className="max-w-full truncate border-brand-200 bg-brand-50 text-brand-700">
            {assignment.course_title ?? "Mata pelajaran"}
          </Badge>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900">{assignment.title}</h3>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            {assignment.teacher_name ?? "Guru pengampu"}
          </p>
        </div>
        <Badge variant={submissionState.variant} className="shrink-0">
          {submissionState.label}
        </Badge>
      </div>

      <div
        className={cn(
          "mt-5 flex items-start gap-3 rounded-xl border p-3.5",
          tone === "red" && !closed && "border-red-200 bg-red-50/60",
          tone === "amber" && !closed && "border-amber-200 bg-amber-50/60",
          (tone === "slate" || closed) && "border-slate-200 bg-slate-50/60"
        )}
      >
        <CalendarClock
          className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "red" && !closed ? "text-red-600" : tone === "amber" && !closed ? "text-amber-700" : "text-slate-500")}
          aria-hidden="true"
        />
        <div className="min-w-0 text-xs">
          <p className="font-semibold text-slate-800">Tenggat {formatDateTime(assignment.due_at)}</p>
          {closed ? (
            <p className="mt-0.5 text-slate-500">Pengumpulan sudah ditutup</p>
          ) : remaining ? (
            <p className={cn("mt-0.5 flex items-center gap-1 font-medium", tone === "red" ? "text-red-700" : tone === "amber" ? "text-amber-800" : "text-slate-600")}>
              <Hourglass className="h-3 w-3" aria-hidden="true" />
              Sisa {remaining}
            </p>
          ) : (
            <p className="mt-0.5 font-medium text-red-700">Tenggat sudah lewat</p>
          )}
          {assignment.allow_late && !closed && <p className="mt-0.5 text-slate-500">Menerima pengumpulan terlambat</p>}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="text-xs text-slate-500">
          {isGraded ? (
            <span className="font-bold text-emerald-700 tabular-nums">
              Nilai {assignment.submission.score} / {assignment.max_score}
            </span>
          ) : (
            <span>Nilai maksimal {assignment.max_score}</span>
          )}
        </div>
        <Link
          to={`/tugas/${assignment.id}`}
          className={buttonVariants({ size: "sm", variant: assignment.can_submit ? "default" : "outline" })}
        >
          {assignment.can_submit ? (assignment.submission ? "Perbarui jawaban" : "Kerjakan") : "Lihat detail"}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
