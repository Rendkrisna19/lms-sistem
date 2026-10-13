import { Check } from "lucide-react";
import { RichContent } from "../../editor/RichContent";
import { cn } from "../../../lib/utils";

/** Satu soal ujian: nomor, teks soal, dan pilihan jawaban berbentuk kartu. */
export function ExamQuestionCard({ question, number, total, selectedOptionId, onSelect, disabled }) {
  const groupName = `answer-${question.id}`;
  const headingId = `question-heading-${question.id}`;

  return (
    <article aria-labelledby={headingId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-base font-extrabold text-white shadow-sm shadow-brand-600/25">
            {number}
          </span>
          <div>
            <h2 id={headingId} className="text-sm font-bold text-slate-900">
              Soal {number} <span className="font-medium text-slate-400">dari {total}</span>
            </h2>
            <p className="text-xs text-slate-500">Pilih satu jawaban yang paling tepat</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          {question.points} poin
        </span>
      </header>

      <div className="space-y-6 px-6 py-7">
        <RichContent html={question.question_text} className="text-[17px] leading-[1.75] text-slate-900" />
        {question.image_url && (
          <img src={question.image_url} alt={`Gambar soal ${number}`} className="max-h-80 rounded-2xl border border-slate-200 bg-slate-50" />
        )}

        <fieldset className="grid gap-3">
          <legend className="sr-only">Pilihan jawaban soal {number}</legend>
          {question.options.map((option) => {
            const checked = selectedOptionId === option.id;
            const inputId = `option-input-${option.id}`;

            return (
              <div key={option.id} className="relative">
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
                    "group flex cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3.5 transition-all duration-150",
                    "peer-focus-visible:ring-4 peer-focus-visible:ring-brand-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                    checked
                      ? "border-brand-500 bg-brand-50 shadow-sm shadow-brand-500/10"
                      : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50/70"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-colors",
                      checked ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700"
                    )}
                    aria-hidden="true"
                  >
                    {option.option_label}
                  </span>
                  <span className="min-w-0 flex-1 space-y-2">
                    <span className="sr-only">Pilihan {option.option_label}: </span>
                    <RichContent html={option.option_text} className="text-[15px] leading-relaxed text-slate-800" />
                    {option.image_url && (
                      <img src={option.image_url} alt={`Gambar pilihan ${option.option_label}`} className="max-h-48 rounded-xl border border-slate-200 bg-white" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white"
                    )}
                    aria-hidden="true"
                  >
                    {checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                </label>
              </div>
            );
          })}
        </fieldset>
      </div>
    </article>
  );
}
