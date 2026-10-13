import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";

const STATUS_VARIANT = {
  Lulus: "success",
  Remedial: "destructive",
  "Sedang Mengerjakan": "indigo",
};

/**
 * Riwayat pengerjaan ujian siswa di kelas & mapel yang diajar guru.
 * Hanya menampilkan data yang diterima dari server; tidak ada data contoh.
 */
export function RecentEvaluationTable({ rows = [], title, subtitle, onExportCSV, isLoading = false }) {
  return (
    <Card className="w-full space-y-4 rounded-3xl border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
      <CardHeader className="flex flex-col justify-between gap-4 space-y-0 border-b border-slate-100 p-0 pb-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs text-slate-500">{subtitle}</CardDescription>
        </div>
        {onExportCSV && (
          <Button variant="outline" size="sm" onClick={onExportCSV} disabled={rows.length === 0}>
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Unduh rekap
          </Button>
        )}
      </CardHeader>

      {rows.length === 0 && !isLoading ? (
        <EmptyState
          className="py-10"
          icon={Download}
          title="Belum ada pengerjaan ujian"
          description="Riwayat muncul setelah siswa mengumpulkan ujian di kelas Anda."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px] uppercase tracking-wide">
                <TableHead>Siswa</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Ujian</TableHead>
                <TableHead>Waktu kumpul</TableHead>
                <TableHead className="text-center">Nilai</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{row.name}</div>
                    <div className="font-mono text-xs text-slate-500">NIS {row.nis ?? "-"}</div>
                  </TableCell>
                  <TableCell className="text-slate-700">{row.kelas ?? "-"}</TableCell>
                  <TableCell className="text-slate-700">{row.quiz_title ?? "-"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-slate-500">{row.submitTime ?? "–"}</TableCell>
                  <TableCell className="text-center font-bold tabular-nums">{row.nilai ?? "–"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={STATUS_VARIANT[row.status] ?? "muted"}>{row.status ?? "–"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
