import { ListOrdered, Plus } from "lucide-react";
import { EditorSection } from "./EditorSection";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";

const STATUS_STYLES = {
  complete: "bg-brand-600 text-white border-brand-600",
  draft: "bg-white text-slate-600 border-slate-300",
  error: "bg-red-50 text-red-700 border-red-300",
};

/** Peta nomor soal: lompat ke soal & lihat soal yang belum lengkap. */
export function QuestionNavigator({ questions, statuses, expandedUids, onJump, onAdd, totalPoints }) {
  const completeCount = questions.filter((q) => statuses[q.uid] === "complete").length;

  return (
    <EditorSection icon={ListOrdered} title="Navigasi Soal" bodyClassName="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-lg font-bold text-slate-900 tabular-nums">{questions.length}</div>
          <div className="text-[11px] text-slate-500">Soal</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-lg font-bold text-emerald-700 tabular-nums">{completeCount}</div>
          <div className="text-[11px] text-slate-500">Lengkap</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-2">
          <div className="text-lg font-bold text-brand-700 tabular-nums">{totalPoints}</div>
          <div className="text-[11px] text-slate-500">Total poin</div>
        </div>
      </div>

      <nav aria-label="Daftar nomor soal">
        <ol className="grid grid-cols-6 gap-1.5">
          {questions.map((question, index) => {
            const status = statuses[question.uid] ?? "draft";
            return (
              <li key={question.uid}>
                <button
                  type="button"
                  onClick={() => onJump(question.uid)}
                  className={cn(
                    "h-9 w-full rounded-lg border text-xs font-bold tabular-nums transition-all hover:scale-105",
                    STATUS_STYLES[status],
                    expandedUids.has(question.uid) && "ring-2 ring-brand-300 ring-offset-1"
                  )}
                  aria-label={`Soal ${index + 1}: ${status === "complete" ? "lengkap" : status === "error" ? "perlu diperbaiki" : "belum lengkap"}`}
                >
                  {index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-brand-600" /> Lengkap</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-slate-300 bg-white" /> Belum lengkap</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded border border-red-300 bg-red-50" /> Perlu diperbaiki</span>
      </div>

      <Button type="button" variant="secondary" className="w-full" onClick={onAdd}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Tambah soal
      </Button>
    </EditorSection>
  );
}
