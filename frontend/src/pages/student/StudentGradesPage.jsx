import { Award, CheckCircle2, FileCheck, RefreshCw, XCircle } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { PageHeader } from "../../components/ui/page-header";
import { StatCard } from "../../components/ui/stat-card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Alert } from "../../components/ui/alert";
import { EmptyState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { formatDateTime } from "../../lib/datetime";

export function StudentGradesPage() {
  const { data, error, isLoading, reload } = useApiQuery("/student/grades");
  const summary = data?.summary;
  const attempts = data?.attempts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hasil & Nilai Saya"
        description="Rekap seluruh ujian dan kuis yang sudah Anda selesaikan."
        actions={
          <Button variant="outline" size="sm" onClick={reload} disabled={isLoading}>
            <RefreshCw className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Segarkan
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" title="Gagal memuat nilai" action={<Button size="sm" variant="outline" onClick={reload}>Coba lagi</Button>}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Ujian Diselesaikan" value={summary?.total_attempts} icon={FileCheck} isLoading={isLoading} />
        <StatCard label="Rata-rata Nilai" value={summary?.average_score ?? null} icon={Award} tone="indigo" isLoading={isLoading} />
        <StatCard label="Lulus KKM" value={summary?.passed} icon={CheckCircle2} tone="emerald" isLoading={isLoading} />
        <StatCard label="Remedial" value={summary?.failed} icon={XCircle} tone="amber" isLoading={isLoading} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ujian</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead className="text-center">Benar</TableHead>
                <TableHead className="text-center">Nilai</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Waktu Selesai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : attempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState icon={FileCheck} title="Belum ada nilai" description="Nilai akan muncul setelah Anda menyelesaikan ujian." />
                  </TableCell>
                </TableRow>
              ) : (
                attempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-semibold text-slate-900">{attempt.quiz_title}</TableCell>
                    <TableCell className="text-slate-600">{attempt.course_title || "-"}</TableCell>
                    <TableCell className="text-center tabular-nums">
                      {attempt.total_correct ?? "–"} / {attempt.total_questions ?? "–"}
                    </TableCell>
                    <TableCell className="text-center font-bold tabular-nums">{attempt.score ?? "–"}</TableCell>
                    <TableCell className="text-center">
                      {attempt.score === null || attempt.score === undefined ? (
                        <Badge variant="muted">Menunggu nilai</Badge>
                      ) : attempt.is_passed ? (
                        <Badge variant="success">Lulus</Badge>
                      ) : (
                        <Badge variant="warning">Remedial</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 whitespace-nowrap">{formatDateTime(attempt.submitted_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
