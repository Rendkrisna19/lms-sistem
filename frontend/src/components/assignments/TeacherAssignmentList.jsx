import { useState } from "react";
import { BookCheck, ClipboardList, Plus, RefreshCw, Clock4, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { useApiQuery } from "../../hooks/useApiQuery";
import { assignmentApi } from "../../features/assignments/api";
import { getErrorMessage } from "../../lib/api";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { StatCard } from "../ui/stat-card";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { AssignmentTeacherCard } from "./AssignmentTeacherCard";
import { AssignmentFormDialog } from "./AssignmentFormDialog";

const ACTIVE_STATES = ["open", "late"];

/** Daftar penugasan milik guru: ringkasan, kartu per tugas, dan aksi buat / ubah / hapus. */
export function TeacherAssignmentList() {
  const list = useApiQuery("/teacher/assignments", { select: (body) => body.data.assignments ?? [] });
  const options = useApiQuery("/teacher/quiz-options", { select: (body) => body.data.assigned_options ?? [] });

  const [form, setForm] = useState({ open: false, assignment: null });
  const [loadingId, setLoadingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const rows = list.data ?? [];
  const summary = {
    total: rows.length,
    active: rows.filter((item) => ACTIVE_STATES.includes(item.status_state)).length,
    toGrade: rows.reduce((sum, item) => sum + Math.max((item.submitted_count ?? 0) - (item.graded_count ?? 0), 0), 0),
    late: rows.reduce((sum, item) => sum + (item.late_count ?? 0), 0),
  };

  const openCreate = () => setForm({ open: true, assignment: null });

  /** Ubah membutuhkan detail lengkap (petunjuk & lampiran), jadi diambil dulu dari server. */
  const openEdit = async (item) => {
    setLoadingId(item.id);
    try {
      const detail = await assignmentApi.teacherDetail(item.id);
      setForm({ open: true, assignment: detail.assignment });
    } catch (err) {
      toast.error(getErrorMessage(err, "Detail penugasan tidak dapat dimuat."));
    } finally {
      setLoadingId(null);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await assignmentApi.remove(deleteTarget.id);
      toast.success(res.message);
      setDeleteTarget(null);
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Penugasan tidak dapat dihapus."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Daftar penugasan</h2>
          <p className="text-sm text-slate-500">Tugas untuk kelas dan mapel yang Anda ajar, lengkap dengan batas waktunya.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={list.reload} disabled={list.isLoading} aria-label="Muat ulang">
            <RefreshCw className={list.isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
          </Button>
          <Button onClick={openCreate} disabled={options.isLoading}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Buat penugasan
          </Button>
        </div>
      </div>

      {list.error && (
        <Alert variant="danger" title="Penugasan gagal dimuat" action={<Button size="sm" variant="outline" onClick={list.reload}>Coba lagi</Button>}>
          {list.error}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total penugasan" value={summary.total} icon={ClipboardList} isLoading={list.isLoading} />
        <StatCard label="Sedang berjalan" value={summary.active} icon={Clock4} tone="emerald" isLoading={list.isLoading} />
        <StatCard label="Perlu dinilai" value={summary.toGrade} icon={BookCheck} tone="amber" isLoading={list.isLoading} />
        <StatCard label="Dikumpulkan terlambat" value={summary.late} icon={Hourglass} tone="red" isLoading={list.isLoading} />
      </div>

      {list.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada penugasan"
          description="Buat penugasan pertama untuk kelas yang Anda ajar. Siswa akan melihat tenggatnya di dashboard mereka."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Buat penugasan
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => (
            <AssignmentTeacherCard
              key={item.id}
              assignment={item}
              isEditing={loadingId === item.id}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AssignmentFormDialog
        open={form.open}
        assignment={form.assignment}
        options={options.data ?? undefined}
        onClose={() => setForm({ open: false, assignment: null })}
        onSaved={() => list.reload()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus penugasan?"
        description={deleteTarget ? `"${deleteTarget.title}" beserta seluruh jawaban siswa akan dihapus permanen.` : ""}
        confirmLabel="Ya, hapus penugasan"
      />
    </div>
  );
}
