import { useMemo, useState } from "react";
import { BookOpen, Edit, Eye, Plus, RefreshCw, School, Trash2, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { StatCard } from "../components/ui/stat-card";
import { AdminDataPanel } from "../components/admin/data/AdminDataPanel";
import { DataTable } from "../components/admin/data/DataTable";
import { DataToolbar } from "../components/admin/data/DataToolbar";
import { ExportButtons } from "../components/admin/data/ExportButtons";
import { ClassroomProfileDialog } from "../components/admin/profile/ClassroomProfileDialog";
import { SchoolScopeSelect } from "../components/admin/SchoolScopeSelect";
import { ClassroomModal } from "../components/modals/ClassroomModal";
import { ClassAssignmentModal } from "../components/modals/ClassAssignmentModal";
import { ClassStudentsModal } from "../components/modals/ClassStudentsModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { adminApi } from "../features/admin/adminApi";
import { useAdminResource } from "../features/admin/useAdminResource";
import { useAdminDelete } from "../features/admin/useAdminDelete";
import { sortOptionsOf } from "../features/admin/tableView";
import { useTableView } from "../hooks/useTableView";
import { getErrorMessage } from "../lib/api";

const PAGE_SIZE = 10;

const mapelCount = (c) => c.subject_assignments?.length ?? 0;
const studentCount = (c) => c.students_count ?? 0;

const SEARCH_FIELDS = [(c) => c.name, (c) => c.code, (c) => c.homeroom_teacher?.name, (c) => c.school?.name, (c) => c.academic_year];

const SORT_COLUMNS = {
  name: { accessor: (c) => c.name ?? "", asc: "Nama kelas A–Z", desc: "Nama kelas Z–A" },
  kode: { accessor: (c) => c.code ?? "", asc: "Kode A–Z", desc: "Kode Z–A" },
  siswa: { accessor: studentCount, asc: "Siswa tersedikit", desc: "Siswa terbanyak" },
  mapel: { accessor: mapelCount, asc: "Mapel tersedikit", desc: "Mapel terbanyak" },
};

const YEAR_FILTER = {
  id: "tahun",
  match: (classroom, value) => classroom.academic_year === value,
};

const WALI_FILTER = {
  id: "wali",
  match: (classroom, value) => (value === "ada" ? Boolean(classroom.homeroom_teacher) : !classroom.homeroom_teacher),
};

const WALI_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "ada", label: "Sudah ada wali" },
  { value: "belum", label: "Belum ada wali" },
];

/** Data kelas (rombel) dalam tabel. Detail, plotting mapel, dan kelola siswa dibuka dari baris. */
export function ClassroomsPage() {
  const { rows: classrooms, isLoading, reload, scope, canWrite, writeParams } = useAdminResource("classrooms");
  const del = useAdminDelete({ writeParams, onDeleted: reload });

  // Satu modal aktif sekaligus: { type: "class" | "assign" | "students" | "detail", classroom }
  const [activeModal, setActiveModal] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  const view = useTableView({
    rows: classrooms,
    searchFields: SEARCH_FIELDS,
    filters: [YEAR_FILTER, WALI_FILTER],
    sortColumns: SORT_COLUMNS,
    defaultSortKey: "name",
    pageSize: PAGE_SIZE,
  });
  const sortOptions = useMemo(() => sortOptionsOf(SORT_COLUMNS), []);

  const yearOptions = useMemo(() => {
    const years = [...new Set(classrooms.map((c) => c.academic_year).filter(Boolean))].sort();
    return [{ value: "all", label: "Semua tahun" }, ...years.map((year) => ({ value: year, label: year }))];
  }, [classrooms]);

  const totals = useMemo(
    () => ({
      students: classrooms.reduce((sum, c) => sum + studentCount(c), 0),
      withHomeroom: classrooms.filter((c) => c.homeroom_teacher).length,
      subjects: classrooms.reduce((sum, c) => sum + mapelCount(c), 0),
    }),
    [classrooms]
  );

  const openModal = (type, classroom = null) => setActiveModal({ type, classroom });
  const closeModal = () => setActiveModal(null);
  const isOpen = (type) => activeModal?.type === type;
  const modalClassroom = activeModal?.classroom ?? null;

  const exportView = async (format) => {
    setExportingFormat(format);
    try {
      await adminApi.exportFile("classrooms", format, view.filteredRows.map((c) => c.id), writeParams);
      toast.success(`Berkas ${format === "pdf" ? "PDF" : "Excel"} berhasil diunduh.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Ekspor gagal. Coba lagi."));
    } finally {
      setExportingFormat(null);
    }
  };

  const columns = [
    { key: "no", label: "No", className: "w-14", render: (_, index) => <span className="text-slate-400 tabular-nums">{index + 1}</span> },
    {
      key: "name",
      label: "Kelas",
      sortKey: "name",
      render: (c) => (
        <div className="min-w-0">
          <button type="button" onClick={() => openModal("detail", c)} className="text-left font-semibold text-slate-900 hover:text-brand-700 hover:underline">
            {c.name}
          </button>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">{c.code}</p>
        </div>
      ),
    },
    ...(scope.isMaster
      ? [{ key: "school", label: "Sekolah", render: (c) => <span className="text-xs text-slate-600">{c.school?.name ?? "–"}</span> }]
      : []),
    {
      key: "tahun",
      label: "Tahun ajaran",
      render: (c) => <Badge variant="outline" className="border-slate-200 text-slate-600">{c.academic_year ?? "–"}</Badge>,
    },
    {
      key: "wali",
      label: "Wali kelas",
      render: (c) =>
        c.homeroom_teacher ? (
          <span className="text-xs font-medium text-slate-800">{c.homeroom_teacher.name}</span>
        ) : (
          <Badge variant="muted">Belum ditentukan</Badge>
        ),
    },
    {
      key: "siswa",
      label: "Siswa",
      sortKey: "siswa",
      align: "center",
      render: (c) => <span className="inline-flex items-center gap-1 font-semibold tabular-nums"><Users className="h-3 w-3 text-slate-400" aria-hidden="true" />{studentCount(c)}</span>,
    },
    {
      key: "mapel",
      label: "Mapel",
      sortKey: "mapel",
      align: "center",
      render: (c) => <span className="inline-flex items-center gap-1 font-semibold tabular-nums"><BookOpen className="h-3 w-3 text-slate-400" aria-hidden="true" />{mapelCount(c)}</span>,
    },
    {
      key: "aksi",
      label: "Aksi",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:bg-brand-50 hover:text-brand-700" onClick={() => openModal("detail", c)} aria-label={`Detail ${c.name}`} title="Lihat detail">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          {canWrite && (
            <>
              <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => openModal("assign", c)} aria-label={`Atur mapel ${c.name}`} title="Atur mata pelajaran">
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => openModal("students", c)} aria-label={`Kelola siswa ${c.name}`} title="Kelola siswa">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => openModal("class", c)} aria-label={`Ubah ${c.name}`} title="Ubah kelas">
                <Edit className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => del.requestDelete({ resource: "classrooms", id: c.id, name: c.name, noun: "Kelas" })}
                aria-label={`Hapus ${c.name}`}
                title="Hapus kelas"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filtering = Boolean(view.query) || (view.filterValues.tahun ?? "all") !== "all" || (view.filterValues.wali ?? "all") !== "all";
  const start = (view.page - 1) * PAGE_SIZE + 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total kelas" value={classrooms.length} icon={School} isLoading={isLoading} />
        <StatCard label="Kelas ber-wali" value={totals.withHomeroom} icon={Users} tone="emerald" isLoading={isLoading} />
        <StatCard label="Total siswa" value={totals.students} icon={Users} tone="indigo" isLoading={isLoading} />
        <StatCard label="Plotting mapel" value={totals.subjects} icon={BookOpen} tone="amber" isLoading={isLoading} />
      </div>

      <AdminDataPanel
        icon={School}
        title="Data kelas"
        description="Rombongan belajar, wali kelas, dan plotting mata pelajaran di setiap kelas."
        actions={
          <>
            <Button variant="ghost" size="sm" className="text-slate-700" onClick={reload} disabled={isLoading} aria-label="Segarkan">
              <RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
              Segarkan
            </Button>
            <ExportButtons onExport={exportView} disabled={view.total === 0} busyFormat={exportingFormat} />
          </>
        }
        primaryAction={
          canWrite ? (
            <Button size="sm" onClick={() => openModal("class", null)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Tambah kelas
            </Button>
          ) : null
        }
        toolbar={
          <DataToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Cari nama kelas, kode, wali kelas…"
            leading={scope.isMaster ? <SchoolScopeSelect scope={scope} className="w-full" /> : null}
            filters={[
              {
                id: "tahun",
                label: "Tahun",
                value: view.filterValues.tahun ?? "all",
                options: yearOptions,
                onChange: (value) => view.setFilter("tahun", value),
              },
              {
                id: "wali",
                label: "Wali kelas",
                value: view.filterValues.wali ?? "all",
                options: WALI_OPTIONS,
                onChange: (value) => view.setFilter("wali", value),
              },
            ]}
            sortValue={view.sortValue}
            sortOptions={sortOptions}
            onSortChange={(value) => {
              const [key, dir] = value.split(":");
              view.setSort(key, dir);
            }}
            summary={`${view.total} dari ${classrooms.length} kelas`}
          />
        }
        table={
          <DataTable
            columns={columns}
            rows={view.pageRows}
            rowKey={(c) => c.id}
            sort={{ key: view.sortKey, dir: view.sortDir }}
            onSort={view.toggleSort}
            isLoading={isLoading}
            startIndex={start}
            emptyTitle={filtering ? "Tidak ada kelas yang cocok" : "Belum ada data kelas"}
            emptyDescription={
              filtering ? "Coba ubah kata kunci atau filter." : canWrite ? "Tambahkan kelas pertama untuk sekolah ini." : "Pilih sekolah untuk melihat datanya."
            }
          />
        }
        pagination={{
          page: view.page,
          totalPages: view.totalPages,
          totalItems: view.total,
          pageSize: PAGE_SIZE,
          onPageChange: view.setPage,
          itemName: "kelas",
        }}
      />

      <ClassroomProfileDialog
        open={isOpen("detail")}
        onClose={closeModal}
        classroom={modalClassroom}
        canWrite={canWrite}
        onEdit={(c) => openModal("class", c)}
        onAssign={(c) => openModal("assign", c)}
        onStudents={(c) => openModal("students", c)}
      />

      <ClassroomModal isOpen={isOpen("class")} onClose={closeModal} onSuccess={reload} classToEdit={modalClassroom} />

      <ClassAssignmentModal isOpen={isOpen("assign")} onClose={closeModal} onSuccess={reload} classroom={modalClassroom} />

      <ClassStudentsModal isOpen={isOpen("students")} onClose={closeModal} onSuccess={reload} classroom={modalClassroom} />

      <ConfirmDeleteModal
        isOpen={Boolean(del.target)}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        isLoading={del.isDeleting}
        title="Hapus rombel kelas?"
        description={`Kelas "${del.target?.name ?? ""}" akan dihapus beserta plotting guru dan mata pelajarannya. Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
