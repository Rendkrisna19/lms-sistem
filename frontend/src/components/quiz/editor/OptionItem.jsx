import { memo } from "react";
import { Check, X } from "lucide-react";
import { RichTextEditor } from "../../editor/RichTextEditor";
import { ImageAttachment } from "./ImageAttachment";
import { FieldError } from "../../ui/field";
import { optionLabel } from "../../../features/quiz/editorModel";
import { cn } from "../../../lib/utils";

/**
 * Satu pilihan jawaban: penanda kunci (radio), teks rich text, dan gambar opsional.
 */
export const OptionItem = memo(function OptionItem({
  option,
  index,
  questionUid,
  questionNumber,
  error,
  canRemove,
  onSetCorrect,
  onChange,
  onRemove,
  onUploadImage,
}) {
  const label = optionLabel(index);
  const radioId = `correct-${option.uid}`;
  const errorId = `option-error-${option.uid}`;

  return (
    <div
      id={`option-${option.uid}`}
      className={cn(
        "rounded-xl border p-3 transition-colors",
        option.is_correct ? "border-emerald-400 bg-emerald-50/60" : error ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Penanda kunci jawaban (radio asli, tampil sebagai huruf) */}
        <div className="pt-1.5">
          <input
            type="radio"
            id={radioId}
            name={`correct-${questionUid}`}
            checked={option.is_correct}
            onChange={() => onSetCorrect(option.uid)}
            className="peer sr-only"
          />
          <label
            htmlFor={radioId}
            title={option.is_correct ? "Kunci jawaban" : `Jadikan ${label} kunci jawaban`}
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1",
              option.is_correct
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
            )}
          >
            {option.is_correct ? <Check className="h-4 w-4" aria-hidden="true" /> : label}
            <span className="sr-only">
              {option.is_correct ? `Pilihan ${label} adalah kunci jawaban soal ${questionNumber}` : `Jadikan pilihan ${label} kunci jawaban soal ${questionNumber}`}
            </span>
          </label>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <RichTextEditor
            variant="compact"
            value={option.option_text}
            onChange={(html) => onChange(option.uid, { option_text: html })}
            onUploadImage={onUploadImage}
            placeholder={`Teks pilihan ${label}${option.image_url ? " (opsional bila ada gambar)" : ""}`}
            ariaLabel={`Teks pilihan ${label} soal ${questionNumber}`}
            ariaDescribedBy={error ? errorId : undefined}
            invalid={!!error}
          />
          <div className="flex flex-wrap items-center gap-2">
            <ImageAttachment
              url={option.image_url}
              onChange={(url) => onChange(option.uid, { image_url: url })}
              onUpload={onUploadImage}
              label={`gambar pilihan ${label}`}
              size="sm"
            />
            {option.is_correct && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Kunci jawaban
              </span>
            )}
          </div>
          <FieldError id={errorId}>{error}</FieldError>
        </div>

        <button
          type="button"
          onClick={() => onRemove(option.uid)}
          disabled={!canRemove}
          className="mt-1.5 h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
          aria-label={`Hapus pilihan ${label}`}
          title={canRemove ? `Hapus pilihan ${label}` : "Minimal 2 pilihan jawaban"}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});
