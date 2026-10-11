import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "../../lib/utils";

export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Pilih salah satu...",
  icon: Icon,
  className = "",
  dropdownClassName = "",
  disabled = false,
  searchable = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && options.length > 5) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, searchable, options.length]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const label = String(opt.label || "").toLowerCase();
    const sub = String(opt.description || opt.sublabel || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return label.includes(query) || sub.includes(query);
  });

  const handleSelect = (optValue) => {
    if (disabled) return;
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full select-none",
        isOpen ? "z-50" : "z-auto"
      )}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 transition-all duration-150 cursor-pointer shadow-xs",
          "hover:border-brand-300 hover:bg-slate-50/60 focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500",
          isOpen ? "border-brand-500 ring-4 ring-brand-500/10 bg-slate-50/50" : "",
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100/60" : "",
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 truncate">
          {Icon && <Icon className="h-4 w-4 text-brand-600/70 shrink-0" />}
          <span className={cn("truncate", !selectedOption ? "text-slate-400 font-normal" : "text-slate-800 font-semibold")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={cn(
              "h-5 w-5 rounded-lg flex items-center justify-center transition-all duration-200",
              isOpen ? "bg-brand-50 text-brand-600 rotate-180" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-2xl shadow-slate-900/25 border border-slate-200 p-1.5 animate-in fade-in-0 zoom-in-95 duration-150",
            dropdownClassName
          )}
        >
          {/* Quick Search if options > 5 */}
          {searchable && options.length > 5 && (
            <div className="p-1 mb-1 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari pilihan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-slate-400">
                {searchQuery ? "Tidak ditemukan hasil yang cocok" : "Tidak ada pilihan tersedia"}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const ItemIcon = opt.icon;

                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-100 cursor-pointer",
                      isSelected
                        ? "bg-brand-50 text-brand-700 font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 truncate">
                      {ItemIcon && (
                        <ItemIcon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-colors",
                            isSelected ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                      )}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {(opt.description || opt.sublabel) && (
                          <span className="block text-[10px] text-slate-400 font-normal truncate">
                            {opt.description || opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="h-4 w-4 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
