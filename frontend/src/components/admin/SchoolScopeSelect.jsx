import { useId } from "react";
import { Building2 } from "lucide-react";
import { NativeSelect } from "../ui/native-select";
import { Alert } from "../ui/alert";

/** Pilihan sekolah untuk admin master. Tidak dirender untuk admin sekolah. */
export function SchoolScopeSelect({ scope, className, allowAll = true }) {
  const id = useId();
  if (!scope.isMaster) return null;

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        Pilih sekolah
      </label>
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <NativeSelect
          id={id}
          value={scope.schoolId}
          onChange={(e) => scope.setSchoolId(e.target.value)}
          disabled={scope.schoolsLoading}
          className="[&_select]:pl-9"
        >
          {allowAll && <option value="all">Semua Sekolah</option>}
          {!allowAll && scope.schoolId === "all" && (
            <option value="all" disabled>
              Pilih sekolah…
            </option>
          )}
          {scope.schools.map((school) => (
            <option key={school.id} value={String(school.id)}>
              {school.name}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}

/** Pemberitahuan bahwa admin master harus memilih sekolah sebelum mengubah data. */
export function SchoolScopeNotice({ scope }) {
  if (!scope.isMaster || scope.canWrite) return null;
  return (
    <Alert variant="info" title="Mode lihat semua sekolah">
      Pilih sekolah terlebih dahulu untuk mengelola data.
    </Alert>
  );
}
