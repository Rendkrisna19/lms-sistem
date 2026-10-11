import { BarChart3 } from "lucide-react";
import { Badge } from "../../ui/badge";
import { EmptyState } from "../../ui/empty-state";
import { cn } from "../../../lib/utils";

const DIFFICULTY = {
  mudah: { label: "Mudah", variant: "success", bar: "bg-emerald-500" },
  sedang: { label: "Sedang", variant: "warning", bar: "bg-amber-500" },
  sulit: { label: "Sulit", variant: "destructive", bar: "bg-red-500" },
};

/** Analisis butir soal: persentase siswa yang menjawab benar per soal. */
export function ItemAnalysisPanel({ items, finishedCount }) {
  if (!finishedCount) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white">
        <EmptyState icon={BarChart3} title="Belum ada data analisis" description="Analisis tingkat kesulitan muncul setelah ada siswa yang menyelesaikan ujian." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Tingkat kesulitan per soal</h3>
        <p className="text-xs text-slate-500">
          Berdasarkan {finishedCount} siswa yang selesai. Mudah ≥ 70% benar, sedang 40–69%, sulit &lt; 40%.
        </p>
      </div>
      <ul className="space-y-3">
        {items.map((item) => {
          const meta = DIFFICULTY[item.difficulty];
          return (
            <li key={item.question_id} className="grid gap-2 sm:grid-cols-[2.5rem_minmax(0,1fr)_14rem] sm:items-center">
              <span className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">{item.number}</span>
              <p className="text-sm text-slate-700 truncate" title={item.excerpt}>
                {item.excerpt || <em className="text-slate-400">Soal bergambar</em>}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 flex-1 rounded-full bg-slate-100 overflow-hidden"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.correct_rate ?? 0}
                  aria-label={`Soal ${item.number}: ${item.correct_rate}% menjawab benar`}
                >
                  <div className={cn("h-full rounded-full", meta?.bar ?? "bg-slate-300")} style={{ width: `${item.correct_rate ?? 0}%` }} />
                </div>
                <span className="w-11 text-right text-xs font-semibold tabular-nums text-slate-700">{item.correct_rate ?? 0}%</span>
                {meta && <Badge variant={meta.variant} className="w-16 justify-center">{meta.label}</Badge>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
