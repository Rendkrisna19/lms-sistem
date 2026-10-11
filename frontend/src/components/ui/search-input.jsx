import { useId } from "react";
import { Search } from "lucide-react";
import { Input } from "./input";
import { cn } from "../../lib/utils";

/** Kolom pencarian dengan ikon dan label tersembunyi untuk pembaca layar. */
export function SearchInput({ value, onChange, placeholder = "Cari…", label, className }) {
  const id = useId();
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        {label || placeholder}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 rounded-xl"
      />
    </div>
  );
}
