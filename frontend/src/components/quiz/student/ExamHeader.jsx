import { SaveIndicator } from "./SaveIndicator";
import { ExamTimer } from "./ExamTimer";

/** Bilah atas ruang ujian: judul, progres, status penyimpanan, dan sisa waktu. */
export function ExamHeader({ course, title, answered, total, saveState, remaining }) {
  const percent = total ? Math.round((answered / total) * 100) : 0;

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-brand-700">{course || "Ujian Online"}</p>
          <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold text-slate-700 tabular-nums">
              {answered} dari {total} soal terjawab
            </p>
            <SaveIndicator status={saveState.status} savedAt={saveState.savedAt} />
          </div>
          <ExamTimer seconds={remaining} />
        </div>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label="Progres menjawab">
        <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </header>
  );
}
