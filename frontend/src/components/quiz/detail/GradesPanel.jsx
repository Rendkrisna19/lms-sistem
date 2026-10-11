import { useMemo, useState } from "react";
import { Award, CheckCircle2, Clock, Search, Users, XCircle } from "lucide-react";
import { StatCard } from "../../ui/stat-card";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { EmptyState } from "../../ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { formatDateTime } from "../../../lib/datetime";

const STATUS = {
  submitted: { label: "Selesai", variant: "secondary" },
  timed_out: { label: "Waktu habis", variant: "warning" },
  in_progress: { label: "Mengerjakan", variant: "indigo" },
  not_started: { label: "Belum mengerjakan", variant: "muted" },
};

export function GradesPanel({ grades }) {
  const [search, setSearch] = useState("");
  const summary = grades.summary;

  const students = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return grades.students.filter(
      (row) => !keyword || row.name.toLowerCase().includes(keyword) || String(row.nomor_induk ?? "").includes(keyword)
    );
  }, [grades.students, search]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Sudah mengumpulkan" value={`${summary.finished}/${summary.total_students}`} icon={Users} tone="brand" />
        <StatCard label="Rata-rata nilai" value={summary.average_score} icon={Award} tone="indigo" />
        <StatCard label="Lulus KKM" value={summary.passed} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Remedial" value={summary.failed} icon={XCircle} tone="amber" />
        <StatCard label="Sedang mengerjakan" value={summary.in_progress} icon={Clock} tone="slate" />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Nilai per siswa</h3>
            <p className="text-xs text-slate-500">
              Nilai tertinggi {summary.highest_score ?? "–"} • terendah {summary.lowest_score ?? "–"}
            </p>
          </div>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama / NIS"
              aria-label="Cari siswa"
              className="pl-9 rounded-xl"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px] uppercase tracking-wide">
                <TableHead className="w-12">No</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Benar</TableHead>
                <TableHead className="text-center">Nilai</TableHead>
                <TableHead className="text-center">Keterangan</TableHead>
                <TableHead>Selesai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={Users} title={search ? "Siswa tidak ditemukan" : "Belum ada siswa di kelas ini"} />
                  </TableCell>
                </TableRow>
              ) : (
                students.map((row, index) => {
                  const status = STATUS[row.status] ?? STATUS.not_started;
                  return (
                    <TableRow key={row.student_id}>
                      <TableCell className="text-slate-400 tabular-nums">{index + 1}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{row.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{row.nomor_induk ?? "-"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {row.score === null ? "–" : `${row.total_correct}/${row.total_questions}`}
                      </TableCell>
                      <TableCell className="text-center text-base font-bold tabular-nums text-slate-900">{row.score ?? "–"}</TableCell>
                      <TableCell className="text-center">
                        {row.is_passed === null ? (
                          <span className="text-slate-400">–</span>
                        ) : row.is_passed ? (
                          <Badge variant="success">Lulus</Badge>
                        ) : (
                          <Badge variant="destructive">Remedial</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">{row.submitted_at ? formatDateTime(row.submitted_at) : "–"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
