import { useMemo, useState } from "react";
import { Edit, Eye, GraduationCap, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { SchoolScopeSelect } from "../components/admin/SchoolScopeSelect";
import { AdminDataPanel } from "../components/admin/data/AdminDataPanel";
import { DataTable } from "../components/admin/data/DataTable";
import { DataToolbar } from "../components/admin/data/DataToolbar";
import { ExportButtons } from "../components/admin/data/ExportButtons";
import { ImportDialog } from "../components/admin/data/ImportDialog";
import { StudentModal } from "../components/modals/StudentModal";
import { UserProfileDialog } from "../components/admin/profile/UserProfileDialog";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { adminApi } from "../features/admin/adminApi";
import { useAdminResource } from "../features/admin/useAdminResource";
import { useAdminDelete } from "../features/admin/useAdminDelete";
import { sortOptionsOf } from "../features/admin/tableView";
import { useTableView } from "../hooks/useTableView";
import { getErrorMessage } from "../lib/api";

const PAGE_SIZE = 10;
const NO_CLASS = "none";

const studentNis = (student) => student.nomor_induk ?? student.nim_nip ?? "";
const classroomName = (student) => student.classroom?.name ?? "";

const SEARCH_FIELDS = [(s) => s.name, studentNis, (s) => s.email, classroomName, (s) => s.school?.name, (s) => s.city, (s) => s.parent_name];

const SORT_COLUMNS = {
  name: { accessor: (s) => s.name ?? "", asc: "Nama A–Z", desc: "Nama Z–A" },
  nomor: { accessor: studentNis, asc: "NIS kecil ke besar", desc: "NIS besar ke kecil" },
  email: { accessor: (s) => s.email ?? "", asc: "Email A–Z", desc: "Email Z–A" },
  kelas: { accessor: classroomName, asc: "Kelas A–Z", desc: "Kelas Z–A" },
};

const CLASS_FILTER = {
  id: "kelas",
  match: (student, value) => (value === NO_CLASS ? !student.classroom_id : String(student.classroom_id) === value),
};

export function StudentsPage() {
  const { rows, isLoading, reload, scope, canWrite, writeParams } = useAdminResource("students");
  const del = useAdminDelete({ writeParams, onDeleted: reload });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);

  const view = useTableView({
    rows,
    searchFields: SEARCH_FIELDS,
    filters: [CLASS_FILTER],
    sortColumns: SORT_COLUMNS,
    defaultSortKey: "name",
    pageSize: PAGE_SIZE,
  });
  const sortOptions = useMemo(() => sortOptionsOf(SORT_COLUMNS), []);

  /** Pilihan kelas dibaca dari data yang ada, agar tidak perlu daftar kelas terpisah. */
  const classOptions = useMemo(() => {
    const classes = new Map();
    rows.forEach((s) => {
      if (s.classroom_id) classes.set(String(s.classroom_id), s.classroom?.name ?? `Kelas ${s.classroom_id}`);
    });
    const sorted = [...classes.entries()].sort((a, b) => a[1].localeCompare(b[1], "id", { numeric: true }));
    return [
      { value: "all", label: "Semua kelas" },
      { value: NO_CLASS, label: "Belum punya kelas" },
      ...sorted.map(([value, label]) => ({ value, label })),
    ];
  }, [rows]);

  const exportView = async (format) => {
    setExportingFormat(format);
    try {
      await adminApi.exportFile("students", format, view.filteredRows.map((s) => s.id), writeParams);
      toast.success(`Berkas ${format === "pdf" ? "PDF" : "Excel"} berhasil diunduh.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Ekspor gagal. Coba lagi."));
    } finally {
      setExportingFormat(null);
    }
  };

  const openCreate = () => {
    setStudentToEdit(null);
    setIsFormOpen(true);
  };

  const openEdit = (student) => {
    setStudentToEdit(student);
    setIsFormOpen(true);
  };

  const columns = [
    { key: "no", label: "No", className: "w-14", render: (_, index) => <span className="text-slate-400 tabular-nums">{index + 1}</span> },
    {
      key: "nomor",
      label: "NIS",
      sortKey: "nomor",
      render: (s) => <span className="font-mono text-xs font-medium text-slate-600">{studentNis(s) || "–"}</span>,
    },
    {
      key: "name",
      label: "Nama siswa",
      sortKey: "name",
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-brand-600 text-xs font-bold text-white">{s.name?.charAt(0) ?? "S"}</AvatarFallback>
          </Avatar>
          <button type="button" onClick={() => setProfileUser(s)} className="text-left font-semibold text-slate-900 hover:text-brand-700 hover:underline">
            {s.name}
          </button>
        </div>
      ),
    },
    ...(scope.isMaster
      ? [{ key: "school", label: "Sekolah", render: (s) => <span className="text-xs text-slate-600">{s.school?.name ?? "–"}</span> }]
      : []),
    { key: "email", label: "Email", sortKey: "email", render: (s) => <span className="text-xs text-slate-600">{s.email}</span> },
    {
      key: "kelas",
      label: "Kelas",
      sortKey: "kelas",
      render: (s) =>
        s.classroom ? (
          <Badge variant="outline" className="gap-1 border-brand-200 bg-brand-50 text-brand-700">
            <GraduationCap className="h-3 w-3" aria-hidden="true" />
            {s.classroom.name}
          </Badge>
        ) : (
          <Badge variant="muted">Belum ada kelas</Badge>
        ),
    },
    {
      key: "kota",
      label: "Kota",
      render: (s) => <span className="text-xs text-slate-600">{s.city || "–"}</span>,
    },
    ...(canWrite
      ? [
          {
            key: "aksi",
            label: "Aksi",
            align: "right",
            render: (s) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:bg-brand-50 hover:text-brand-700" onClick={() => setProfileUser(s)} aria-label={`Detail ${s.name}`} title="Lihat detail">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} aria-label={`Ubah ${s.name}`} title="Ubah data">
                  <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => del.requestDelete({ resource: "students", id: s.id, name: s.name, noun: "Data Siswa" })}
                  aria-label={`Hapus ${s.name}`}
                  title="Hapus data"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const start = (view.page - 1) * PAGE_SIZE + 1;
  const filtering = Boolean(view.query) || (view.filterValues.kelas ?? "all") !== "all";

  return (
    <>
      <AdminDataPanel
        icon={GraduationCap}
        title="Data siswa"
        description="Siswa yang terdaftar di sekolah. Impor dari Excel untuk menambah banyak siswa sekaligus."
        actions={
          <>
            <Button variant="ghost" size="sm" className="text-slate-700" onClick={reload} disabled={isLoading} aria-label="Segarkan">
              <RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
              Segarkan
            </Button>
            {canWrite && (
              <Button variant="ghost" size="sm" className="text-slate-700" onClick={() => setIsImportOpen(true)}>
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Impor Excel
              </Button>
            )}
            <ExportButtons onExport={exportView} disabled={view.total === 0 || !canWrite} busyFormat={exportingFormat} />
          </>
        }
        primaryAction={canWrite ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Tambah siswa
          </Button>
        ) : null}
        toolbar={
          <DataToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Cari nama, NIS, kelas, email…"
            leading={scope.isMaster ? <SchoolScopeSelect scope={scope} className="w-full" /> : null}
            filters={[
              {
                id: "kelas",
                label: "Kelas",
                value: view.filterValues.kelas ?? "all",
                options: classOptions,
                onChange: (value) => view.setFilter("kelas", value),
              },
            ]}
            sortValue={view.sortValue}
            sortOptions={sortOptions}
            onSortChange={(value) => {
              const [key, dir] = value.split(":");
              view.setSort(key, dir);
            }}
            summary={`${view.total} dari ${rows.length} siswa`}
          />
        }
        table={
          <DataTable
            columns={columns}
            rows={view.pageRows}
            rowKey={(s) => s.id}
            sort={{ key: view.sortKey, dir: view.sortDir }}
            onSort={view.toggleSort}
            isLoading={isLoading}
            startIndex={start}
            emptyTitle={filtering ? "Tidak ada siswa yang cocok" : "Belum ada data siswa"}
            emptyDescription={
              filtering
                ? "Coba ubah kata kunci atau filter kelas."
                : canWrite
                ? "Tambahkan siswa satu per satu, atau impor dari Excel."
                : "Pilih sekolah untuk melihat datanya."
            }
          />
        }
        pagination={{
          page: view.page,
          totalPages: view.totalPages,
          totalItems: view.total,
          pageSize: PAGE_SIZE,
          onPageChange: view.setPage,
          itemName: "siswa",
        }}
      />

      <ImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        resource="students"
        label="Siswa"
        params={writeParams}
        onImported={reload}
      />

      <StudentModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={reload} studentToEdit={studentToEdit} />

      <UserProfileDialog
        open={Boolean(profileUser)}
        onClose={() => setProfileUser(null)}
        user={profileUser}
        role="murid"
        canWrite={canWrite}
        onEdit={openEdit}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(del.target)}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        isLoading={del.isDeleting}
        title="Hapus data siswa?"
        description={`Data siswa "${del.target?.name ?? ""}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
      />
    </>
  );
}
