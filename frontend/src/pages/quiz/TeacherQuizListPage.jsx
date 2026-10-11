import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useApiQuery } from "../../hooks/useApiQuery";
import { quizApi } from "../../features/quiz/api";
import { getErrorMessage } from "../../lib/api";
import { PageHeader } from "../../components/ui/page-header";
import { Button, buttonVariants } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";
import { EmptyState } from "../../components/ui/empty-state";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { Pagination } from "../../components/ui/pagination";
import { QuizSummaryCards } from "../../components/quiz/teacher/QuizSummaryCards";
import { QuizFilters } from "../../components/quiz/teacher/QuizFilters";
import { QuizTable } from "../../components/quiz/teacher/QuizTable";

const PAGE_SIZE = 8;

export function TeacherQuizListPage() {
  const navigate = useNavigate();
  const { data, setData, error, isLoading, reload } = useApiQuery("/teacher/quizzes");
  const [search, setSearch] = useState("");
  const [classroom, setClassroom] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const quizzes = useMemo(() => data?.quizzes ?? [], [data]);
  const assignedOptions = data?.assigned_options ?? [];

  const classroomOptions = useMemo(() => {
    const seen = new Map();
    assignedOptions.forEach((opt) => seen.set(String(opt.classroom_id), `${opt.classroom_name} (${opt.classroom_code})`));
    return [...seen].map(([value, label]) => ({ value, label }));
  }, [assignedOptions]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (classroom !== "all" && String(quiz.classroom_id) !== classroom) return false;
      if (status !== "all" && quiz.status_state !== status) return false;
      if (!keyword) return true;
      return [quiz.title, quiz.course?.title, quiz.classroom?.name, quiz.instructions].some((text) => text?.toLowerCase().includes(keyword));
    });
  }, [quizzes, search, classroom, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPageAnd = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const handleToggle = async (quiz) => {
    setTogglingId(quiz.id);
    try {
      const res = await quizApi.toggleStatus(quiz.id);
      setData((prev) => ({
        ...prev,
        quizzes: prev.quizzes.map((item) => (item.id === quiz.id ? { ...item, ...res.data } : item)),
      }));
      toast.success(res.message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengubah status ujian."));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await quizApi.remove(deleteTarget.id);
      toast.success(res.message);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menghapus ujian."));
    } finally {
      setIsDeleting(false);
    }
  };

  const noAssignment = !isLoading && !error && assignedOptions.length === 0;
  const hasFilters = search || classroom !== "all" || status !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ujian & Kuis"
        description="Kelola paket ujian, butir soal bergambar, kunci jawaban, serta jadwal buka–tutup untuk kelas yang Anda ampu."
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={isLoading}>
              <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
              Segarkan
            </Button>
            <Button onClick={() => navigate("/ujian/baru")} disabled={noAssignment}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Buat Ujian Baru
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="danger" title="Gagal memuat daftar ujian" action={<Button size="sm" variant="outline" onClick={reload}>Coba lagi</Button>}>
          {error}
        </Alert>
      )}

      {noAssignment && (
        <Alert variant="warning" title="Anda belum memiliki plotting kelas & mata pelajaran">
          Ujian hanya dapat dibuat untuk kelas yang ditugaskan kepada Anda. Hubungi admin sekolah untuk menambahkan plotting
          mengajar pada menu Data Kelas.
        </Alert>
      )}

      <QuizSummaryCards summary={data?.summary} isLoading={isLoading} />

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden" aria-label="Daftar ujian">
        <QuizFilters
          search={search}
          onSearchChange={resetPageAnd(setSearch)}
          classroom={classroom}
          onClassroomChange={resetPageAnd(setClassroom)}
          status={status}
          onStatusChange={resetPageAnd(setStatus)}
          classroomOptions={classroomOptions}
          total={filtered.length}
        />

        <QuizTable
          quizzes={visible}
          isLoading={isLoading}
          togglingId={togglingId}
          onToggle={handleToggle}
          onDelete={setDeleteTarget}
          emptyState={
            <EmptyState
              icon={Award}
              title={hasFilters ? "Tidak ada ujian yang cocok" : "Belum ada ujian"}
              description={hasFilters ? "Ubah kata kunci atau filter untuk melihat ujian lainnya." : "Buat paket ujian pertama Anda untuk kelas yang diampu."}
              action={
                !hasFilters && !noAssignment && (
                  <Link to="/ujian/baru" className={buttonVariants()}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Buat Ujian Baru
                  </Link>
                )
              }
            />
          }
        />

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} itemsPerPage={PAGE_SIZE} />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus paket ujian?"
        description={`"${deleteTarget?.title}" beserta seluruh butir soal dan riwayat nilai siswa akan dihapus permanen.`}
        confirmLabel="Hapus ujian"
      >
        {deleteTarget?.total_attempts > 0 && (
          <Alert variant="warning" className="mt-3">
            Ujian ini sudah dikerjakan oleh {deleteTarget.total_attempts} siswa. Nilai mereka akan ikut terhapus.
          </Alert>
        )}
      </ConfirmDialog>
    </div>
  );
}
