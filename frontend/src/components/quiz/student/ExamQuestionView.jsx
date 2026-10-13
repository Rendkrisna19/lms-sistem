import { Check } from "lucide-react";
import { RichContent } from "../../editor/RichContent";
import { cn } from "../../../lib/utils";

/** Satu soal di ruang ujian. Pilihan jawaban memakai radio asli (mendukung tombol panah). */
export function ExamQuestionView({ question, number, total, selectedOptionId, onSelect, disabled }) {
  const groupName = `answer-${question.id}`;
  const headingId = `question-heading-${question.id}`;

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 sm:px-7 py-4">
        <h2 id={headingId} className="text-sm font-bold text-brand-700">
          Soal {number} <span className="font-normal text-slate-400">dari {total}</span>
        </h2>
        <span className="text-xs text-slate-500">{question.points} poin</span>
      </div>

      <div className="px-5 sm:px-7 py-6 space-y-6">
        <RichContent html={question.question_text} className="text-base leading-[1.7]" />
        {question.image_url && (
          <img src={question.image_url} alt={`Gambar soal ${number}`} className="max-h-80 rounded-xl border border-slate-200 bg-slate-50" />
        )}

        <fieldset className="space-y-2.5">
          <legend className="sr-only">Pilihan jawaban soal {number}</legend>
          {question.options.map((option) => {
            const checked = selectedOptionId === option.id;
            const inputId = `option-input-${option.id}`;
            return (
              <div key={option.id}>
                <input
                  type="radio"
                  id={inputId}
                  name={groupName}
                  value={option.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onSelect(option.id)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={inputId}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed",
                    checked ? "border-brand-500 bg-brand-50/70" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                  )}
                >
                  <span
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold transition-colors",
                      checked ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {checked ? <Check className="h-4 w-4" aria-hidden="true" /> : option.option_label}
                  </span>
                  <span className="min-w-0 flex-1 space-y-2 pt-1.5">
                    <span className="sr-only">Pilihan {option.option_label}: </span>
                    <RichContent html={option.option_text} className="text-[15px]" />
                    {option.image_url && (
                      <img src={option.image_url} alt={`Gambar pilihan ${option.option_label}`} className="max-h-48 rounded-lg border border-slate-200 bg-white" />
                    )}
                  </span>
                </label>
              </div>
            );
          })}
        </fieldset>
      </div>
    </section>
  );
}
