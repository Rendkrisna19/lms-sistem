import { useId } from "react";
import { cn } from "../../lib/utils";

/**
 * Toggle on/off dengan role="switch". Bisa dipakai dengan label & deskripsi.
 */
export function Switch({ checked, onCheckedChange, disabled, label, description, tone = "brand", className, id }) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = `${switchId}-description`;

  const track = (
    <button
      type="button"
      role="switch"
      id={switchId}
      aria-checked={checked}
      aria-describedby={description ? descriptionId : undefined}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? (tone === "success" ? "bg-emerald-500" : "bg-brand-600") : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5.5" : "translate-x-0.5"
        )}
      />
    </button>
  );

  if (!label) return <span className={className}>{track}</span>;

  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <label htmlFor={switchId} className="text-sm font-semibold text-slate-800 cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {track}
    </div>
  );
}
