import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Pembungkus label + kontrol form + petunjuk + pesan error.
 * Gunakan `htmlFor` yang sama dengan id kontrol agar label dapat diklik & dibaca screen reader.
 */
export function Field({ label, htmlFor, required, hint, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-slate-700">
          {label}
          {required && (
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? <FieldError id={htmlFor ? `${htmlFor}-error` : undefined}>{error}</FieldError> : hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function FieldError({ children, id, className }) {
  if (!children) return null;
  return (
    <p id={id} className={cn("flex items-start gap-1.5 text-xs font-medium text-red-600", className)}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
