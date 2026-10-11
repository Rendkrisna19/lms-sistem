import { CheckCircle2, School } from "lucide-react";
import { FieldError } from "../../ui/field";
import { assignmentKey } from "../../../features/quiz/editorModel";
import { cn } from "../../../lib/utils";

/**
 * Pilihan kelas + mata pelajaran berdasarkan plotting mengajar guru (radio group).
 */
export function AssignmentPicker({ options, value, onChange, error, disabled }) {
  return (
    <fieldset id="field-assignment" className="space-y-2" aria-invalid={!!error} aria-describedby={error ? "assignment-error" : undefined}>
      <legend className="text-[13px] font-semibold text-slate-700 mb-1.5">
        Kelas & mata pelajaran tujuan<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
      </legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => {
          const key = assignmentKey(option.classroom_id, option.course_id);
          const checked = value === key;
          return (
            <label
              key={option.assignment_id}
              className={cn(
                "relative flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500",
                checked ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              <input
                type="radio"
                name="assignment"
                value={key}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(key)}
                className="sr-only"
              />
              <span className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", checked ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500")}>
                <School className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900 truncate">
                  {option.classroom_name} <span className="font-mono text-xs text-slate-500">({option.classroom_code})</span>
                </span>
                <span className="block text-xs text-slate-500 truncate mt-0.5">{option.course_title}</span>
              </span>
              {checked && <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0" aria-hidden="true" />}
            </label>
          );
        })}
      </div>
      <FieldError id="assignment-error">{error}</FieldError>
    </fieldset>
  );
}
