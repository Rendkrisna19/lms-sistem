import { CheckCircle2, Info } from "lucide-react";
import { cn } from "../../../lib/utils";

/**
 * Ringkasan progres ujian. Hanya informasi: nomor soal tidak dapat diklik
 * karena siswa wajib menjawab berurutan tanpa melompat.
 */
export function ExamProgress({ questions, answers, currentIndex }) {
  const answered = questions.filter((question) => answers[question.id]).length;
  const percent = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  return (
    <section aria-label="Progres jawaban" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Progres</p>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {answered}
            <span className="text-base font-semibold text-slate-400"> / {questions.length}</span>
          </p>
        </div>
        <span className="text-sm font-bold tabular-nums text-brand-700">{percent}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      <ol className="mt-5 grid grid-cols-6 gap-1.5" aria-label="Status setiap soal">
        {questions.map((question, index) => {
          const isAnswered = Boolean(answers[question.id]);
          const isCurrent = index === currentIndex;
          return (
            <li
              key={question.id}
              aria-current={isCurrent ? "step" : undefined}
              title={isAnswered ? `Soal ${index + 1}: sudah dijawab` : `Soal ${index + 1}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg text-[11px] font-bold tabular-nums",
                isAnswered && "bg-brand-600 text-white",
                !isAnswered && isCurrent && "bg-white text-brand-700 ring-2 ring-brand-500",
                !isAnswered && !isCurrent && "bg-slate-100 text-slate-400"
              )}
            >
              {isAnswered && !isCurrent ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex gap-2.5 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        <p>Soal dikerjakan berurutan. Jawaban terkunci setelah Anda lanjut ke soal berikutnya.</p>
      </div>
    </section>
  );
}
