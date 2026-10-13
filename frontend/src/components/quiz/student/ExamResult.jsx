import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Hourglass, XCircle } from "lucide-react";
import { buttonVariants } from "../../ui/button";
import { formatDateTime } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";

/** Hasil ujian setelah dikumpulkan. Nilai hanya tampil bila guru mengizinkan. */
export function ExamResult({ quizTitle, attempt }) {
  const visible = Boolean(attempt?.result_visible);
  const passed = Boolean(attempt?.is_passed);

  const status = !visible
    ? { label: "Menunggu penilaian", icon: Hourglass, tone: "text-slate-600" }
    : passed
    ? { label: "Lulus KKM", icon: CheckCircle2, tone: "text-emerald-700" }
    : { label: "Belum mencapai KKM", icon: XCircle, tone: "text-amber-700" };
  const Icon = status.icon;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <article className="min-w-0 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ujian selesai</p>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{quizTitle}</h1>
        </header>

        {visible ? (
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
            <div>
              <p className="text-sm text-slate-500">Nilai</p>
              <p className="text-6xl font-bold tabular-nums text-slate-900">{attempt.score}</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Jawaban benar</dt>
                <dd className="font-semibold text-slate-900">
                  {attempt.total_correct} dari {attempt.total_questions} soal
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">KKM</dt>
                <dd className="font-semibold text-slate-900">{attempt.passing_score}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="max-w-xl text-sm leading-relaxed text-slate-600">
            Jawaban Anda sudah diterima. Nilai akan diumumkan oleh guru setelah ujian dinilai.
          </p>
        )}

        {visible && !passed && (
          <p className="border-l-2 border-amber-400 pl-4 text-sm leading-relaxed text-slate-700">
            Nilai belum mencapai KKM. Jika guru membuka kesempatan ujian ulang, ujian ini akan kembali muncul di daftar ujian Anda.
          </p>
        )}
      </article>

      <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 xl:sticky xl:top-28">
        <div className={cn("flex items-center gap-2 text-sm font-semibold", status.tone)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {status.label}
        </div>

        {attempt?.submitted_at && (
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {attempt.status === "timed_out" ? "Dikumpulkan otomatis" : "Dikumpulkan"} {formatDateTime(attempt.submitted_at)}
          </p>
        )}

        <div className="grid gap-2">
          <Link to="/ujian" className={buttonVariants({ variant: "outline" })}>
            Kembali ke daftar ujian
          </Link>
          <Link to="/nilai" className={buttonVariants({ variant: "ghost" })}>
            Lihat semua nilai
          </Link>
        </div>
      </aside>
    </div>
  );
}
