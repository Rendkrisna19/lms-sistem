import { Check, Lightbulb } from "lucide-react";
import { RichContent } from "../../editor/RichContent";
import { cn } from "../../../lib/utils";

/** Pratinjau soal untuk guru, lengkap dengan kunci jawaban & pembahasan. */
export function QuestionsPreview({ questions }) {
  return (
    <ol className="space-y-4">
      {questions.map((question, index) => (
        <li key={question.id} className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">Soal {index + 1}</span>
            <span className="text-xs text-slate-500">{question.points} poin</span>
          </div>
          <RichContent html={question.question_text} />
          {question.image_url && (
            <img src={question.image_url} alt={`Gambar soal ${index + 1}`} className="max-h-72 rounded-xl border border-slate-200" loading="lazy" />
          )}
          <ul className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => (
              <li
                key={option.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3",
                  option.is_correct ? "border-emerald-400 bg-emerald-50/60" : "border-slate-200"
                )}
              >
                <span
                  className={cn(
                    "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold",
                    option.is_correct ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {option.is_correct ? <Check className="h-3.5 w-3.5" aria-label="Kunci jawaban" /> : option.option_label}
                </span>
                <div className="min-w-0 space-y-2 text-sm">
                  <RichContent html={option.option_text} className="text-sm" />
                  {option.image_url && (
                    <img src={option.image_url} alt={`Gambar pilihan ${option.option_label}`} className="max-h-32 rounded-lg border border-slate-200 bg-white" loading="lazy" />
                  )}
                </div>
              </li>
            ))}
          </ul>
          {question.explanation && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" /> Pembahasan
              </p>
              <RichContent html={question.explanation} className="text-sm" />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
