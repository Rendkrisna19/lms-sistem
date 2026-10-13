import { useMemo } from "react";
import { GraduationCap, RefreshCw, ShieldCheck, Users, UserCog } from "lucide-react";
import { useApiQuery } from "../hooks/useApiQuery";
import { useSchoolScope } from "../hooks/useSchoolScope";
import { useTableView } from "../hooks/useTableView";
import { sortOptionsOf } from "../features/admin/tableView";
import { formatDate } from "../lib/datetime";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { StatCard } from "../components/ui/stat-card";
import { Alert } from "../components/ui/alert";
import { AdminDataPanel } from "../components/admin/data/AdminDataPanel";
import { DataTable } from "../components/admin/data/DataTable";
import { DataToolbar } from "../components/admin/data/DataToolbar";
import { SchoolScopeSelect } from "../components/admin/SchoolScopeSelect";

const PAGE_SIZE = 10;

const ROLE_META = {
  guru: { label: "Guru", variant: "secondary" },
  murid: { label: "Siswa", variant: "success" },
  admin: { label: "Admin sekolah", variant: "indigo" },
};

const SEARCH_FIELDS = [(a) => a.name, (a) => a.email, (a) => a.nomor_induk, (a) => a.school, (a) => a.classroom];

const SORT_COLUMNS = {
  name: { accessor: (a) => a.name ?? "", asc: "Nama A–Z", desc: "Nama Z–A" },
  role: { accessor: (a) => ROLE_META[a.role]?.label ?? "", asc: "Peran A–Z", desc: "Peran Z–A" },
  nomor: { accessor: (a) => a.nomor_induk ?? "", asc: "NIP/NIS kecil ke besar", desc: "NIP/NIS besar ke kecil" },
  dibuat: { accessor: (a) => a.created_at ?? "", asc: "Terlama dulu", desc: "Terbaru dulu" },
};

const ROLE_FILTER = {
  id: "role",
  match: (account, value) => account.role === value,
};

const ROLE_OPTIONS = [
  { value: "all", label: "Semua peran" },
  { value: "guru", label: "Guru" },
  { value: "murid", label: "Siswa" },
  { value: "admin", label: "Admin sekolah" },
];

/** Manajemen user: seluruh akun sekolah (guru, siswa, admin) dengan filter peran dan pencarian. */
export function ManajemenUserPage() {
  const scope = useSchoolScope();
  const accounts = useApiQuery("/admin/accounts", { params: scope.params, select: (body) => body.data });
  const rows = useMemo(() => accounts.data?.accounts ?? [], [accounts.data]);
  const summary = accounts.data?.summary;

  const view = useTableView({
    rows,
    searchFields: SEARCH_FIELDS,
    filters: [ROLE_FILTER],
    sortColumns: SORT_COLUMNS,
    defaultSortKey: "name",
    pageSize: PAGE_SIZE,
  });
  const sortOptions = useMemo(() => sortOptionsOf(SORT_COLUMNS), []);

  const columns = [
    { key: "no", label: "No", className: "w-14", render: (_, index) => <span className="text-slate-400 tabular-nums">{index + 1}</span> },
    {
      key: "name",
      label: "Nama",
      sortKey: "name",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">
            {a.name}
            {a.is_self && <span className="ml-2 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">Anda</span>}
          </p>
          <p className="truncate text-xs text-slate-500">{a.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Peran",
      sortKey: "role",
      render: (a) => {
        const meta = ROLE_META[a.role] ?? { label: a.role, variant: "muted" };
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      key: "nomor",
      label: "NIP / NIS",
      sortKey: "nomor",
      render: (a) => <span className="font-mono text-xs text-slate-600">{a.nomor_induk ?? "–"}</span>,
    },
    ...(scope.isMaster ? [{ key: "school", label: "Sekolah", render: (a) => <span className="text-xs text-slate-600">{a.school ?? "–"}</span> }] : []),
    {
      key: "kelas",
      label: "Kelas",
      render: (a) => <span className="text-xs text-slate-600">{a.classroom ?? (a.role === "murid" ? "Belum ada kelas" : "–")}</span>,
    },
    {
      key: "dibuat",
      label: "Terdaftar",
      sortKey: "dibuat",
      render: (a) => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(a.created_at)}</span>,
    },
  ];

  const filtering = Boolean(view.query) || (view.filterValues.role ?? "all") !== "all";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total akun" value={summary?.total} icon={Users} isLoading={accounts.isLoading} />
        <StatCard label="Guru" value={summary?.guru} icon={GraduationCap} tone="indigo" isLoading={accounts.isLoading} />
        <StatCard label="Siswa" value={summary?.murid} icon={GraduationCap} tone="emerald" isLoading={accounts.isLoading} />
        <StatCard label="Admin sekolah" value={summary?.admin} icon={ShieldCheck} tone="amber" isLoading={accounts.isLoading} />
      </div>

      {accounts.error && (
        <Alert variant="danger" title="Akun gagal dimuat" action={<Button size="sm" variant="outline" onClick={accounts.reload}>Coba lagi</Button>}>
          {accounts.error}
        </Alert>
      )}

      <AdminDataPanel
        icon={UserCog}
        title="Manajemen user"
        description="Semua akun guru, siswa, dan admin sekolah. Admin sekolah ditambahkan dari menu Pengaturan."
        actions={
          <Button variant="ghost" size="sm" className="text-slate-700" onClick={accounts.reload} disabled={accounts.isLoading} aria-label="Segarkan">
            <RefreshCw className={accounts.isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden="true" />
            Segarkan
          </Button>
        }
        toolbar={
          <DataToolbar
            query={view.query}
            onQueryChange={view.setQuery}
            placeholder="Cari nama, email, NIP/NIS, kelas…"
            leading={scope.isMaster ? <SchoolScopeSelect scope={scope} className="w-full" /> : null}
            filters={[
              {
                id: "role",
                label: "Peran",
                value: view.filterValues.role ?? "all",
                options: ROLE_OPTIONS,
                onChange: (value) => view.setFilter("role", value),
              },
            ]}
            sortValue={view.sortValue}
            sortOptions={sortOptions}
            onSortChange={(value) => {
              const [key, dir] = value.split(":");
              view.setSort(key, dir);
            }}
            summary={`${view.total} dari ${rows.length} akun`}
          />
        }
        table={
          <DataTable
            columns={columns}
            rows={view.pageRows}
            rowKey={(a) => `${a.role}-${a.id}`}
            sort={{ key: view.sortKey, dir: view.sortDir }}
            onSort={view.toggleSort}
            isLoading={accounts.isLoading}
            startIndex={(view.page - 1) * PAGE_SIZE + 1}
            emptyTitle={filtering ? "Tidak ada akun yang cocok" : "Belum ada akun"}
            emptyDescription={filtering ? "Coba ubah kata kunci atau filter peran." : "Akun guru, siswa, dan admin akan muncul di sini."}
          />
        }
        pagination={{
          page: view.page,
          totalPages: view.totalPages,
          totalItems: view.total,
          pageSize: PAGE_SIZE,
          onPageChange: view.setPage,
          itemName: "akun",
        }}
      />
    </div>
  );
}
