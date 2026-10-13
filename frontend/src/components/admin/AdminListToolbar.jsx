import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { SchoolScopeSelect } from "./SchoolScopeSelect";

/**
 * Bilah pencarian + filter sekolah (admin master) + total hasil, dipakai bersama oleh halaman daftar admin.
 * `children` untuk filter tambahan (mis. filter kelas pada halaman siswa).
 */
export function AdminListToolbar({ search, onSearchChange, placeholder, scope, total, unit, searchWidth = "sm:w-64", children }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 max-w-2xl">
        <div className={`relative w-full ${searchWidth}`}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
          />
        </div>

        <SchoolScopeSelect scope={scope} className="w-full sm:w-56" />
        {children}
      </div>

      <span className="text-xs text-slate-400 font-medium shrink-0">
        Total: <strong className="text-slate-700">{total} {unit}</strong>
      </span>
    </div>
  );
}
