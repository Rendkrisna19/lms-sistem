import { cn } from "../../../lib/utils";

/** Kartu bagian pada halaman editor ujian. */
export function EditorSection({ id, icon: Icon, title, description, actions, children, className, bodyClassName }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-xs scroll-mt-28", className)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 pt-5">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <span className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <h2 id={id ? `${id}-title` : undefined} className="text-[15px] font-bold text-slate-900">
              {title}
            </h2>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
