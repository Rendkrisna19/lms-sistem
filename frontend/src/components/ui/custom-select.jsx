import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "../../lib/utils";

const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 300;

/**
 * Pilihan kustom yang aksesibel: role combobox/listbox, navigasi keyboard (panah, Home, End, Enter, Escape),
 * dan daftar yang dirender di portal sehingga tidak terpotong oleh dialog atau area yang bisa di-scroll.
 *
 * @param {object} props
 * @param {string|number} props.value
 * @param {(value: string|number) => void} props.onChange  menerima nilai langsung, bukan event
 * @param {Array<{value: string|number, label: string, description?: string, icon?: any}>} props.options
 * @param {boolean} [props.searchable]  default: aktif bila pilihan lebih dari 6
 */
export function CustomSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Pilih salah satu",
  icon: Icon,
  className,
  disabled = false,
  searchable,
  invalid = false,
  size = "md",
}) {
  const reactId = useId();
  const controlId = id ?? reactId;
  const listId = `${controlId}-listbox`;
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [position, setPosition] = useState(null);

  const canSearch = searchable ?? options.length > 6;
  const selected = options.find((option) => String(option.value) === String(value));

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(keyword));
  }, [options, query]);

  const measure = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && rect.top > spaceBelow;
    setPosition({
      left: rect.left,
      width: rect.width,
      ...(openUpward ? { bottom: window.innerHeight - rect.top + MENU_GAP } : { top: rect.bottom + MENU_GAP }),
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const openMenu = () => {
    if (disabled) return;
    measure();
    setActive(Math.max(0, options.findIndex((option) => String(option.value) === String(value))));
    setOpen(true);
  };

  const choose = (option) => {
    onChange?.(option.value);
    close();
    triggerRef.current?.focus();
  };

  // Fokus: kotak cari bila ada, jika tidak daftar itu sendiri
  useEffect(() => {
    if (!open) return;
    const target = canSearch ? searchRef.current : listRef.current;
    target?.focus();
  }, [open, canSearch]);

  // Tutup saat klik di luar, halaman digulir, atau ukuran jendela berubah.
  // Escape ditangkap di fase capture agar dialog pembungkus tidak ikut tertutup.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) close();
    };
    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
      triggerRef.current?.focus();
    };
    const onScroll = (event) => {
      if (listRef.current?.contains(event.target)) return;
      close();
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  const handleListKey = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(filtered.length - 1);
    } else if (event.key === "Enter" && filtered[active]) {
      event.preventDefault();
      choose(filtered[active]);
    }
  };

  const onTriggerKey = (event) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) openMenu();
    }
  };

  const sizeClass = size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-3.5 text-sm";

  return (
    <>
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKey}
        className={cn(
          "group flex w-full items-center justify-between gap-2.5 rounded-xl border bg-white text-left shadow-sm transition-all duration-150",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15",
          invalid ? "border-red-400" : open ? "border-brand-500 ring-4 ring-brand-500/10" : "border-slate-200 hover:border-brand-300",
          disabled && "cursor-not-allowed bg-slate-50 opacity-60",
          !disabled && "cursor-pointer",
          sizeClass,
          className
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )}
          <span className={cn("truncate", selected ? "font-semibold text-slate-900" : "text-slate-400")}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
            open ? "rotate-180 bg-brand-50 text-brand-600" : "text-slate-400 group-hover:text-slate-600"
          )}
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={controlId}
            onKeyDown={handleListKey}
            style={{ position: "fixed", zIndex: 10010, left: position.left, width: position.width, top: position.top, bottom: position.bottom }}
            className="animate-in fade-in-0 zoom-in-95 origin-top overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5 outline-none duration-150"
          >
            {canSearch && (
              <div className="mb-1.5 border-b border-slate-100 p-1.5 pb-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActive(0);
                    }}
                    onKeyDown={handleListKey}
                    placeholder="Cari pilihan…"
                    aria-label="Cari pilihan"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            )}

            <div className="max-h-[200px] space-y-0.5 overflow-y-auto pr-0.5 [scrollbar-width:thin]" style={{ maxHeight: MENU_MAX_HEIGHT - 60 }}>
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-slate-400">
                  {query ? "Tidak ada yang cocok dengan pencarian" : "Belum ada pilihan"}
                </p>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = String(option.value) === String(value);
                  const isActive = index === active;
                  return (
                    <div
                      key={String(option.value)}
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive || undefined}
                      onMouseEnter={() => setActive(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(option)}
                      className={cn(
                        "relative flex cursor-pointer items-center justify-between gap-3 rounded-xl py-2 pl-3 pr-2.5 text-[13px] transition-colors",
                        isActive ? "bg-brand-50" : "",
                        isSelected ? "font-semibold text-brand-800" : "text-slate-700"
                      )}
                    >
                      {isSelected && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-brand-600" aria-hidden="true" />}
                      <span className="flex min-w-0 items-center gap-2.5">
                        {option.icon && <option.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
                        <span className="min-w-0">
                          <span className="block truncate">{option.label}</span>
                          {option.description && <span className="block truncate text-[11px] font-normal text-slate-400">{option.description}</span>}
                        </span>
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
