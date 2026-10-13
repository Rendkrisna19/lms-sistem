import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle2, ChevronRight, Clock, FileQuestion, Hourglass, Lock, PlayCircle, Target } from "lucide-react";
import { Badge } from "../../ui/badge";
import { buttonVariants } from "../../ui/button";
import { formatDateTime, formatRelativeFuture } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";
import { studentQuizState } from "../../../features/quiz/studentQuizState";

const STATE_META = {
  available: { label: "Tersedia", variant: "success" },
  retake: { label: "Ujian ulang", variant: "warning" },
  in_progress: { label: "Sedang dikerjakan", variant: "indigo" },
  upcoming: { label: "Belum dibuka", variant: "muted" },
  closed: { label: "Ditutup", variant: "warning" },
  finished: { label: "Selesai", variant: "secondary" },
  unavailable: { label: "Belum tersedia", variant: "muted" },
};

export function StudentQuizCard({ quiz }) {
  const state = studentQuizState(quiz);
  const meta = STATE_META[state];
  const attempt = quiz.attempt;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700 truncate max-w-[70%]">
          {quiz.course?.title ?? "Mata pelajaran"}
        </Badge>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">{quiz.title}</h3>
      {quiz.teacher?.name && <p className="text-xs text-slate-500 mt-0.5">{quiz.teacher.name}</p>}

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 py-2">
          <dt className="sr-only">Durasi</dt>
          <dd className="flex flex-col items-center gap-0.5 text-xs text-slate-500">
            <Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <span className="font-semibold text-slate-800">{quiz.duration_minutes} mnt</span>
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 py-2">
          <dt className="sr-only">Jumlah soal</dt>
          <dd className="flex flex-col items-center gap-0.5 text-xs text-slate-500">
            <FileQuestion className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <span className="font-semibold text-slate-800">{quiz.total_questions} soal</span>
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 py-2">
          <dt className="sr-only">KKM</dt>
          <dd className="flex flex-col items-center gap-0.5 text-xs text-slate-500">
            <Target className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <span className="font-semibold text-slate-800">KKM {quiz.passing_score}</span>
          </dd>
        </div>
      </dl>

      {(quiz.starts_at || quiz.ends_at) && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
          <CalendarClock className="h-3.5 w-3.5 mt-px shrink-0" aria-hidden="true" />
          <span>
            {quiz.starts_at ? formatDateTime(quiz.starts_at) : "Sudah dibuka"} – {quiz.ends_at ? formatDateTime(quiz.ends_at) : "tanpa batas"}
          </span>
        </p>
      )}

      <div className="mt-auto pt-5">
        {state === "finished" ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              {attempt.status === "timed_out" ? "Dikumpulkan otomatis" : "Sudah dikumpulkan"}
            </span>
            {attempt.result_visible ? (
              <span className={cn("text-sm font-bold", attempt.is_passed ? "text-emerald-700" : "text-amber-700")}>
                {attempt.score} • {attempt.is_passed ? "Lulus" : "Remedial"}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500">Menunggu nilai</span>
            )}
          </div>
        ) : state === "upcoming" ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
            <Hourglass className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Dibuka {formatRelativeFuture(quiz.starts_at)}
          </div>
        ) : state === "closed" || state === "unavailable" ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
            <Lock className="h-4 w-4 text-slate-500" aria-hidden="true" />
            {state === "closed" ? "Jadwal ujian sudah berakhir" : "Ujian belum memiliki soal"}
          </div>
        ) : (
          <Link
            to={`/ujian/${quiz.id}/kerjakan`}
            className={buttonVariants({ className: "w-full", variant: state === "in_progress" ? "secondary" : "default" })}
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            {state === "in_progress" ? "Lanjutkan Ujian" : state === "retake" ? "Mulai Ujian Ulang" : "Mulai Kerjakan"}
            <ChevronRight className="h-4 w-4 ml-auto" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
