import { Search } from "lucide-react";
import { Input } from "../../ui/input";
import { NativeSelect } from "../../ui/native-select";
import { QUIZ_STATUS_FILTERS } from "../QuizStatusBadge";

export function QuizFilters({ search, onSearchChange, classroom, onClassroomChange, status, onStatusChange, classroomOptions, total }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-slate-100">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Cari judul ujian, mata pelajaran, atau kelas..."
          aria-label="Cari ujian"
          className="pl-9 rounded-xl"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:flex">
        <NativeSelect
          aria-label="Filter kelas"
          value={classroom}
          onChange={(event) => onClassroomChange(event.target.value)}
          options={[{ value: "all", label: "Semua kelas" }, ...classroomOptions]}
          className="lg:w-52"
        />
        <NativeSelect
          aria-label="Filter status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          options={QUIZ_STATUS_FILTERS}
          className="lg:w-44"
        />
      </div>
      <span className="text-xs text-slate-500 shrink-0" aria-live="polite">
        <strong className="text-slate-800">{total}</strong> ujian
      </span>
    </div>
  );
}
