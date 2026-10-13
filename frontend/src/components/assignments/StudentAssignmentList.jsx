import { useMemo } from "react";
import { BellRing, CheckCircle2, ClipboardList, RefreshCw } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useNow } from "../../features/assignments/useNow";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { StatCard } from "../ui/stat-card";
import { AssignmentStudentCard } from "./AssignmentStudentCard";

/** Daftar tugas siswa beserta tenggat dan status pengumpulan. */
export function StudentAssignmentList() {
  const list = useApiQuery("/student/assignments", { select: (body) => body.data });
  const now = useNow();

  const assignments = useMemo(() => list.data?.assignments ?? [], [list.data]);
  const summary = useMemo(
    () => ({
      total: assignments.length,
      pending: assignments.filter((item) => item.can_submit && !item.submission).length,
      done: assignments.filter((item) => Boolean(item.submission)).length,
      graded: assignments.filter((item) => item.submission?.state === "graded").length,
    }),
    [assignments]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Tugas dari guru</h2>
          <p className="text-sm text-slate-500">
            {list.data?.classroom ? `Kelas ${list.data.classroom.name} (${list.data.classroom.code})` : "Tugas untuk kelas Anda"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={list.reload} disabled={list.isLoading} aria-label="Muat ulang">
          <RefreshCw className={list.isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
        </Button>
      </div>

      {list.error && (
        <Alert variant="danger" title="Tugas gagal dimuat" action={<Button size="sm" variant="outline" onClick={list.reload}>Coba lagi</Button>}>
          {list.error}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total tugas" value={summary.total} icon={ClipboardList} isLoading={list.isLoading} />
        <StatCard label="Belum dikumpulkan" value={summary.pending} icon={BellRing} tone="amber" isLoading={list.isLoading} />
        <StatCard label="Sudah dikumpulkan" value={summary.done} icon={CheckCircle2} tone="emerald" isLoading={list.isLoading} />
        <StatCard label="Sudah dinilai" value={summary.graded} icon={CheckCircle2} tone="indigo" isLoading={list.isLoading} />
      </div>

      {list.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada tugas" description="Tugas dari guru akan muncul di sini beserta tenggat pengumpulannya." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((item) => (
            <AssignmentStudentCard key={item.id} assignment={item} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
