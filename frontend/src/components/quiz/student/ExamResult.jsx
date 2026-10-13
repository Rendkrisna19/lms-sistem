import { Link } from "react-router-dom";
import { Award, Clock, Hourglass } from "lucide-react";
import { buttonVariants } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { formatDateTime } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";

export function ExamResult({ quizTitle, attempt }) {
  const visible = attempt?.result_visible;
  const passed = attempt?.is_passed;

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm space-y-5">
        <div
          className={cn(
            "mx-auto h-16 w-16 rounded-3xl flex items-center justify-center text-white shadow-lg",
            !visible ? "bg-brand-600 shadow-brand-600/25" : passed ? "bg-emerald-500 shadow-emerald-500/25" : "bg-amber-500 shadow-amber-500/25"
          )}
        >
          {visible ? <Award className="h-8 w-8" aria-hidden="true" /> : <Hourglass className="h-8 w-8" aria-hidden="true" />}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ujian selesai</p>
          <h1 className="mt-1 text-base font-bold text-slate-900">{quizTitle}</h1>
        </div>

        {visible ? (
          <div className="space-y-2">
            <div className="text-5xl font-black text-slate-900 tabular-nums">{attempt.score}</div>
            <Badge variant={passed ? "success" : "warning"} className="px-3 py-1 text-xs">
              {passed ? "Lulus — memenuhi KKM" : `Remedial — KKM ${attempt.passing_score}`}
            </Badge>
            <p className="text-sm text-slate-500">
              Benar {attempt.total_correct} dari {attempt.total_questions} soal.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed">
            Jawaban Anda sudah diterima. Nilai akan diumumkan oleh guru setelah ujian selesai dinilai.
          </p>
        )}

        {attempt?.submitted_at && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {attempt.status === "timed_out" ? "Dikumpulkan otomatis" : "Dikumpulkan"} {formatDateTime(attempt.submitted_at)}
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/ujian" className={buttonVariants({ variant: "outline" })}>
            Daftar ujian
          </Link>
          <Link to="/nilai" className={buttonVariants()}>
            Lihat semua nilai
          </Link>
        </div>
      </div>
    </div>
  );
}
