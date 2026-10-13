import { useMemo, useState } from "react";
import { BarChart3, Building2, Edit, Eye, GraduationCap, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { StatCard } from "../components/ui/stat-card";
import { Alert } from "../components/ui/alert";
import { AdminDataPanel } from "../components/admin/data/AdminDataPanel";
import { DataTable } from "../components/admin/data/DataTable";
import { DataToolbar } from "../components/admin/data/DataToolbar";
import { ExportButtons } from "../components/admin/data/ExportButtons";
import { SchoolProfileDialog } from "../components/admin/profile/SchoolProfileDialog";
import { SchoolModal } from "../components/modals/SchoolModal";
import { SchoolAnalyticsModal } from "../components/modals/SchoolAnalyticsModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { adminApi } from "../features/admin/adminApi";
import { useAdminDelete } from "../features/admin/useAdminDelete";
import { sortOptionsOf } from "../features/admin/tableView";
import { useApiQuery } from "../hooks/useApiQuery";
import { useTableView } from "../hooks/useTableView";
import { getErrorMessage } from "../lib/api";

const PAGE_SIZE = 10;

const SEARCH_FIELDS = [(s) => s.name, (s) => s.npsn, (s) => s.address, (s) => s.admin?.name, (s) => s.email];

const SORT_COLUMNS = {
  name: { accessor: (s) => s.name ?? "", asc: "Nama A–Z", desc: "Nama Z–A" },
  npsn: { accessor: (s) => s.npsn ?? "", asc: "NPSN kecil ke besar", desc: "NPSN besar ke kecil" },
  siswa: { accessor: (s) => s.students_count ?? 0, asc: "Siswa tersedikit", desc: "Siswa terbanyak" },
  guru: { accessor: (s) => s.teachers_count ?? 0, asc: "Guru tersedikit", desc: "Guru terbanyak" },
};

const STATUS_FILTER = {
  id: "status",
  match: (school, value) => school.status === value,
};

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
];

/** Data sekolah platform. Hanya tersedia untuk admin master. */
export function SchoolsPage() {
  const schoolsQuery = useApiQuery("/admin/schools", { select: (body) => body.data ?? [] });
  const schools = useMemo(() => schoolsQuery.data ?? [], [schoolsQuery.data]);
  const del = useAdminDelete({ writeParams: {}, onDeleted: schoolsQuery.reload });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState(null);
  const [profileSchool, setProfileSchool] = useState(null);
  const [analyticsSchool, setAnalyticsSchool] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  const view = useTableView({
    rows: schools,
    searchFields: SEARCH_FIELDS,
    filters: [STATUS_FILTER],
    sortColumns: SORT_COLUMNS,
    defaultSortKey: "name",
    pageSize: PAGE_SIZE,
  });
  const sortOptions = useMemo(() => sortOptionsOf(SORT_COLUMNS), []);

  const totals = useMemo(
    () => ({
      active: schools.filter((s) => s.status === "active").length,
      teachers: schools.reduce((sum, s) => sum + (s.teachers_count ?? 0), 0),
      students: schools.reduce((sum, s) => sum + (s.students_count ?? 0), 0),
    }),
    [schools]
  );

  const openCreate = () => {
    setSchoolToEdit(null);
    setIsFormOpen(true);
  };

  const openEdit = (school) => {
    setSchoolToEdit(school);
    setIsFormOpen(true);
  };

  const exportView = async (format) => {
    setExportingFormat(format);
    try {
      await adminApi.exportFile("schools", format, view.filteredRows.map((s) => s.id));
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
      label: "Sekolah",
      sortKey: "name",
      render: (s) => (
        <div className="min-w-0">
          <button type="button" onClick={() => setProfileSchool(s)} className="text-left font-semibold text-slate-900 hover:text-brand-700 hover:underline">
            {s.name}
          </button>
          <p className="font-mono text-[11px] text-slate-500">NPSN {s.npsn ?? "–"}</p>
        </div>
      ),
    },
    {
      key: "jenjang",
      label: "Jenjang",
      render: (s) => (
        <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
          {s.jenjang ?? "–"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (s) =>
        s.status === "active" ? <Badge variant="success">Aktif</Badge> : <Badge variant="muted">Nonaktif</Badge>,
    },
    {
      key: "admin",
      label: "Admin sekolah",
      render: (s) => <span className="text-xs text-slate-600">{s.admin?.name ?? "Belum ada admin"}</span>,
    },
    {
      key: "guru",
      label: "Guru",
      sortKey: "guru",
      align: "center",
      render: (s) => <span className="inline-flex items-center gap-1 font-semibold tabular-nums"><Users className="h-3 w-3 text-slate-400" aria-hidden="true" />{s.teachers_count ?? 0}</span>,
    },
    {
      key: "siswa",
      label: "Siswa",
      sortKey: "siswa",
      align: "center",
      render: (s) => <span className="inline-flex items-center gap-1 font-semibold tabular-nums"><GraduationCap className="h-3 w-3 text-slate-400" aria-hidden="true" />{s.students_count ?? 0}</span>,
    },
    {
      key: "aksi",
      label: "Aksi",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:bg-brand-50 hover:text-brand-700" onClick={() => setProfileSchool(s)} aria-label={`Detail ${s.name}`} title="Lihat detail">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setAnalyticsSchool(s)} aria-label={`Analitik ${s.name}`} title="Analitik">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} aria-label={`Ubah ${s.name}`} title="Ubah data">
            <Edit className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-red-600 hover:bg-red-50"
            onClick={() => del.requestDelete({ resource: "schools", id: s.id, name: s.name, noun: "Sekolah" })}
            aria-label={`Hapus ${s.name}`}
            title="Hapus sekolah"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const filtering = Boolean(view.query) || (view.filterValues.status ?? "all") !== "all";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sekolah terdaftar" value={schools.length} icon={Building2} isLoading={schoolsQuery.isLoading} />
        <StatCard label="Sekolah aktif" value={totals.active} icon={Building2} tone="emerald" isLoading={schoolsQuery.isLoading} />
        <StatCard label="Total guru" value={totals.teachers} icon={Users} tone="indigo" isLoading={schoolsQuery.isLoading} />
        <StatCard label="Total siswa" value={totals.students} icon={GraduationCap} tone="amber" isLoading={schoolsQuery.isLoading} />
      </div>

      {schoolsQuery.error && (
        <Alert variant="danger" title="Data sekolah gagal dimuat" action={<Button size="sm" variant="outline" onClick={schoolsQuery.reload}>Coba lagi</Button>}>
          {schoolsQuery.error}
        </Alert>
      )}

      <AdminDataPanel
        icon={Building2}
        title="Data sekolah"
        description="Sekolah mitra yang terdaftar di platform Cendekia beserta admin sekolahnya."
        actions={
          <>
            <Button variant="ghost" size="sm" className="text-slate-700" onClick={schoolsQuery.reload} disabled={schoolsQuery.isLoading} aria-label="Segarkan">
              <RefreshCw className={schoolsQuery.isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
              Segarkan
            </Button>
            <ExportButtons onExport={exportView} disabled={view.total === 0} busyFormat={exportingFormat} />
          </>
        }
        primaryAction={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Tambah sekolah
          </Button>
        }
        toolbar={
          <DataToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Cari nama sekolah, NPSN, alamat, admin…"
            filters={[
              {
                id: "status",
                label: "Status",
                value: view.filterValues.status ?? "all",
                options: STATUS_OPTIONS,
                onChange: (value) => view.setFilter("status", value),
              },
            ]}
            sortValue={view.sortValue}
            sortOptions={sortOptions}
            onSortChange={(value) => {
              const [key, dir] = value.split(":");
              view.setSort(key, dir);
            }}
            summary={`${view.total} dari ${schools.length} sekolah`}
          />
        }
        table={
          <DataTable
            columns={columns}
            rows={view.pageRows}
            rowKey={(s) => s.id}
            sort={{ key: view.sortKey, dir: view.sortDir }}
            onSort={view.toggleSort}
            isLoading={schoolsQuery.isLoading}
            startIndex={(view.page - 1) * PAGE_SIZE + 1}
            emptyTitle={filtering ? "Tidak ada sekolah yang cocok" : "Belum ada sekolah"}
            emptyDescription={filtering ? "Coba ubah kata kunci atau filter status." : "Tambahkan sekolah mitra pertama untuk memulai."}
          />
        }
        pagination={{
          page: view.page,
          totalPages: view.totalPages,
          totalItems: view.total,
          pageSize: PAGE_SIZE,
          onPageChange: view.setPage,
          itemName: "sekolah",
        }}
      />

      <SchoolProfileDialog
        open={Boolean(profileSchool)}
        onClose={() => setProfileSchool(null)}
        school={profileSchool}
        onEdit={openEdit}
        onAnalytics={(school) => setAnalyticsSchool(school)}
      />

      <SchoolModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={schoolsQuery.reload} schoolToEdit={schoolToEdit} />

      <SchoolAnalyticsModal isOpen={Boolean(analyticsSchool)} onClose={() => setAnalyticsSchool(null)} school={analyticsSchool} />

      <ConfirmDeleteModal
        isOpen={Boolean(del.target)}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        isLoading={del.isDeleting}
        title="Hapus data sekolah?"
        description={`Sekolah "${del.target?.name ?? ""}" akan dihapus beserta asosiasi guru, siswa, dan kelasnya. Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
