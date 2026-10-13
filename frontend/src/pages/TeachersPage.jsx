import { useMemo, useState } from "react";
import { Edit, Eye, GraduationCap, Plus, RefreshCw, Trash2, Upload, Users } from "lucide-react";
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
import { TeacherModal } from "../components/modals/TeacherModal";
import { UserProfileDialog } from "../components/admin/profile/UserProfileDialog";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { adminApi } from "../features/admin/adminApi";
import { useAdminResource } from "../features/admin/useAdminResource";
import { useAdminDelete } from "../features/admin/useAdminDelete";
import { sortOptionsOf } from "../features/admin/tableView";
import { useTableView } from "../hooks/useTableView";
import { getErrorMessage } from "../lib/api";

const PAGE_SIZE = 10;

const teacherNip = (teacher) => teacher.nomor_induk ?? teacher.nim_nip ?? "";
const mapelCount = (teacher) => teacher.teaching_assignments_count ?? 0;

const SEARCH_FIELDS = [(t) => t.name, teacherNip, (t) => t.email, (t) => t.school?.name, (t) => t.education_major, (t) => t.city];

const SORT_COLUMNS = {
  name: { accessor: (t) => t.name ?? "", asc: "Nama A–Z", desc: "Nama Z–A" },
  nomor: { accessor: teacherNip, asc: "NIP kecil ke besar", desc: "NIP besar ke kecil" },
  email: { accessor: (t) => t.email ?? "", asc: "Email A–Z", desc: "Email Z–A" },
  mapel: { accessor: mapelCount, asc: "Mapel tersedikit", desc: "Mapel terbanyak" },
};

const MAPEL_FILTER = {
  id: "mapel",
  match: (teacher, value) => (value === "ada" ? mapelCount(teacher) > 0 : mapelCount(teacher) === 0),
};

const MAPEL_OPTIONS = [
  { value: "all", label: "Semua" },
  { value: "ada", label: "Sudah diplot mapel" },
  { value: "belum", label: "Belum diplot mapel" },
];

export function TeachersPage() {
  const { rows, isLoading, reload, scope, canWrite, writeParams } = useAdminResource("teachers");
  const del = useAdminDelete({ writeParams, onDeleted: reload });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);

  const view = useTableView({
    rows,
    searchFields: SEARCH_FIELDS,
    filters: [MAPEL_FILTER],
    sortColumns: SORT_COLUMNS,
    defaultSortKey: "name",
    pageSize: PAGE_SIZE,
  });
  const sortOptions = useMemo(() => sortOptionsOf(SORT_COLUMNS), []);

  const exportView = async (format) => {
    setExportingFormat(format);
    try {
      await adminApi.exportFile("teachers", format, view.filteredRows.map((t) => t.id), writeParams);
      toast.success(`Berkas ${format === "pdf" ? "PDF" : "Excel"} berhasil diunduh.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Ekspor gagal. Coba lagi."));
    } finally {
      setExportingFormat(null);
    }
  };

  const openCreate = () => {
    setTeacherToEdit(null);
    setIsFormOpen(true);
  };

  const openEdit = (teacher) => {
    setTeacherToEdit(teacher);
    setIsFormOpen(true);
  };

  const columns = [
    { key: "no", label: "No", className: "w-14", render: (_, index) => <span className="text-slate-400 tabular-nums">{index + 1}</span> },
    {
      key: "nomor",
      label: "NIP",
      sortKey: "nomor",
      render: (t) => <span className="font-mono text-xs font-medium text-slate-600">{teacherNip(t) || "–"}</span>,
    },
    {
      key: "name",
      label: "Nama guru",
      sortKey: "name",
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-brand-600 text-xs font-bold text-white">{t.name?.charAt(0) ?? "G"}</AvatarFallback>
          </Avatar>
          <button type="button" onClick={() => setProfileUser(t)} className="text-left font-semibold text-slate-900 hover:text-brand-700 hover:underline">
            {t.name}
          </button>
        </div>
      ),
    },
    ...(scope.isMaster
      ? [{ key: "school", label: "Sekolah", render: (t) => <span className="text-xs text-slate-600">{t.school?.name ?? "–"}</span> }]
      : []),
    { key: "email", label: "Email", sortKey: "email", render: (t) => <span className="text-xs text-slate-600">{t.email}</span> },
    {
      key: "mapel",
      label: "Mapel diampu",
      sortKey: "mapel",
      align: "center",
      render: (t) =>
        mapelCount(t) > 0 ? (
          <Badge variant="secondary" className="gap-1">
            <GraduationCap className="h-3 w-3" aria-hidden="true" />
            {mapelCount(t)} mapel
          </Badge>
        ) : (
          <Badge variant="muted">Belum diplot</Badge>
        ),
    },
    {
      key: "pendidikan",
      label: "Pendidikan",
      render: (t) => (
        <span className="text-xs text-slate-600">
          {[t.education_level, t.education_major].filter(Boolean).join(" · ") || "–"}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            key: "aksi",
            label: "Aksi",
            align: "right",
            render: (t) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:bg-brand-50 hover:text-brand-700" onClick={() => setProfileUser(t)} aria-label={`Detail ${t.name}`} title="Lihat detail">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)} aria-label={`Ubah ${t.name}`} title="Ubah data">
                  <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => del.requestDelete({ resource: "teachers", id: t.id, name: t.name, noun: "Data Guru" })}
                  aria-label={`Hapus ${t.name}`}
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

  return (
    <>
      <AdminDataPanel
        icon={Users}
        title="Data guru"
        description="Guru pengampu yang terdaftar di sekolah. Impor dari Excel untuk menambah banyak guru sekaligus."
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
            <ExportButtons
              onExport={exportView}
              disabled={view.total === 0 || !canWrite}
              busyFormat={exportingFormat}
            />
          </>
        }
        primaryAction={canWrite ? (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Tambah guru
          </Button>
        ) : null}
                toolbar={
          <DataToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Cari nama, NIP, email…"
            leading={scope.isMaster ? <SchoolScopeSelect scope={scope} className="w-full" /> : null}
            filters={[
              {
                id: "mapel",
                label: "Plotting",
                value: view.filterValues.mapel ?? "all",
                options: MAPEL_OPTIONS,
                onChange: (value) => view.setFilter("mapel", value),
              },
            ]}
            sortValue={view.sortValue}
            sortOptions={sortOptions}
            onSortChange={(value) => {
              const [key, dir] = value.split(":");
              view.setSort(key, dir);
            }}
            summary={`${view.total} dari ${rows.length} guru`}
          />
        }
        table={
          <DataTable
            columns={columns}
            rows={view.pageRows}
            rowKey={(t) => t.id}
            sort={{ key: view.sortKey, dir: view.sortDir }}
            onSort={view.toggleSort}
            isLoading={isLoading}
            startIndex={start}
            emptyTitle={view.query || view.filterValues.mapel !== "all" ? "Tidak ada guru yang cocok" : "Belum ada data guru"}
            emptyDescription={
              view.query || view.filterValues.mapel !== "all"
                ? "Coba ubah kata kunci atau filter."
                : canWrite
                ? "Tambahkan guru satu per satu, atau impor dari Excel."
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
          itemName: "guru",
        }}
      />

      <ImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        resource="teachers"
        label="Guru"
        params={writeParams}
        onImported={reload}
      />

      <TeacherModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={reload} teacherToEdit={teacherToEdit} />

      <UserProfileDialog
        open={Boolean(profileUser)}
        onClose={() => setProfileUser(null)}
        user={profileUser}
        role="guru"
        canWrite={canWrite}
        onEdit={openEdit}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(del.target)}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        isLoading={del.isDeleting}
        title="Hapus data guru?"
        description={`Data guru "${del.target?.name ?? ""}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
      />
    </>
  );
}
