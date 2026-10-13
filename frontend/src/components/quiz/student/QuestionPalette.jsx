import { cn } from "../../../lib/utils";

/** Grid nomor soal: terjawab, ragu-ragu, dan soal aktif. */
export function QuestionPalette({ questions, answers, flags, currentIndex, onSelect }) {
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-4">
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Terjawab</span>
          <span className="tabular-nums text-slate-500">
            {answeredCount}/{questions.length}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progres menjawab">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav aria-label="Nomor soal">
        <ol className="grid grid-cols-5 gap-2">
          {questions.map((question, index) => {
            const answered = !!answers[question.id];
            const flagged = !!flags[question.id];
            const current = index === currentIndex;
            return (
              <li key={question.id}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-current={current ? "step" : undefined}
                  aria-label={`Soal ${index + 1}${answered ? ", terjawab" : ", belum dijawab"}${flagged ? ", ditandai ragu-ragu" : ""}`}
                  className={cn(
                    "relative h-10 w-full rounded-lg border text-sm font-bold tabular-nums transition-all",
                    flagged ? "border-amber-400 bg-amber-100 text-amber-900" : answered ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                    current && "ring-2 ring-brand-500 ring-offset-2"
                  )}
                >
                  {index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500" /> Terjawab</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-amber-400 bg-amber-100" /> Ragu-ragu</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-slate-300 bg-white" /> Belum dijawab</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-brand-500" /> Soal aktif</span>
      </div>
    </div>
  );
}
