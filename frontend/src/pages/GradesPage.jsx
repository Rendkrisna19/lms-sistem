import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useApiQuery } from "../hooks/useApiQuery";
import { PageHeader } from "../components/ui/page-header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert } from "../components/ui/alert";
import { CustomSelect } from "../components/ui/custom-select";
import { RecentEvaluationTable } from "../components/dashboard/RecentEvaluationTable";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua status" },
  { value: "Lulus", label: "Lulus" },
  { value: "Remedial", label: "Remedial" },
  { value: "Sedang Mengerjakan", label: "Sedang mengerjakan" },
];

/** Rekap nilai seluruh ujian yang diajar guru, dengan pencarian dan filter status. */
export function GradesPage() {
  const grades = useApiQuery("/teacher/grades", { select: (body) => body.data ?? [] });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (grades.data ?? []).filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!keyword) return true;
      return [row.name, row.nis, row.kelas, row.quiz_title].some((value) => String(value ?? "").toLowerCase().includes(keyword));
    });
  }, [grades.data, search, status]);

  const exportCsv = () => {
    const header = ["No", "NIS", "Nama siswa", "Kelas", "Ujian", "Nilai", "Status", "Waktu kumpul"];
    const lines = rows.map((row, index) =>
      [index + 1, row.nis, row.name, row.kelas, row.quiz_title, row.nilai ?? "", row.status, row.submitTime ?? ""]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-nilai-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap nilai siswa"
        description="Nilai seluruh ujian di kelas dan mapel yang Anda ajar."
        actions={
          <Button variant="outline" size="sm" onClick={grades.reload} disabled={grades.isLoading}>
            Segarkan
          </Button>
        }
      />

      {grades.error && (
        <Alert variant="danger" title="Rekap nilai gagal dimuat" action={<Button size="sm" variant="outline" onClick={grades.reload}>Coba lagi</Button>}>
          {grades.error}
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama, NIS, kelas, ujian"
            aria-label="Cari nilai"
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <div className="w-full sm:w-56">
          <CustomSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} placeholder="Status" searchable={false} />
        </div>
      </div>

      <RecentEvaluationTable
        rows={rows}
        isLoading={grades.isLoading}
        onExportCSV={exportCsv}
        title="Nilai ujian siswa"
        subtitle={`${rows.length} pengerjaan ditampilkan`}
      />
    </div>
  );
}
