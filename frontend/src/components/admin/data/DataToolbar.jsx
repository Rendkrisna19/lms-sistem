import { ArrowDownUp, Search } from "lucide-react";
import { Input } from "../../ui/input";
import { CustomSelect } from "../../ui/custom-select";

/**
 * Bilah di atas tabel: pencarian, filter, dan urutan (naik / turun).
 *
 * @param {object} props
 * @param {string} props.query
 * @param {(value: string) => void} props.onQueryChange
 * @param {string} props.placeholder
 * @param {Array<{id: string, label: string, value: string, options: Array<{value: string, label: string}>, onChange: (value: string) => void}>} props.filters
 * @param {string} props.sortValue          "kunci:asc" atau "kunci:desc"
 * @param {Array<{value: string, label: string}>} props.sortOptions
 * @param {(value: string) => void} props.onSortChange
 * @param {string} props.summary            ringkasan hasil, mis. "12 dari 40 guru"
 * @param {React.ReactNode} props.leading   elemen di depan pencarian (mis. pemilih sekolah admin master)
 */
export function DataToolbar({ query, onQueryChange, placeholder, filters = [], sortValue, sortOptions, onSortChange, summary, leading }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center">
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
        {leading && <div className="min-w-0 xl:w-56">{leading}</div>}
        <div className="relative min-w-0 xl:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 rounded-xl pl-9"
          />
        </div>

        {filters.map((filter) => (
          <label key={filter.id} className="flex min-w-0 items-center gap-2 text-xs text-slate-500 xl:w-auto">
            <span className="shrink-0 font-medium">{filter.label}</span>
            <CustomSelect
              size="sm"
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options}
              searchable={false}
              className="min-w-0 flex-1 xl:w-52"
            />
          </label>
        ))}

        <label className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
          <ArrowDownUp className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only shrink-0 font-medium">Urutkan</span>
          <CustomSelect size="sm" value={sortValue} onChange={onSortChange} options={sortOptions} searchable={false} className="min-w-0 flex-1 xl:w-48" />
        </label>
      </div>

      <p className="shrink-0 text-xs text-slate-500 xl:ml-auto">{summary}</p>
    </div>
  );
}
