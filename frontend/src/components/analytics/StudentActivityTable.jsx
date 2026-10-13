import { BookOpen, FileText, Gauge, Video, Volume2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const PACE_TONE = {
  "Cepat Mandiri": "success",
  "Aktif Stabil": "secondary",
  "Perlu Pendampingan": "warning",
};

function AccessCount({ icon: Icon, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
      <Icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
      {value ?? 0}×
    </span>
  );
}

/** Tabel aktivitas akses materi per siswa. Data sudah difilter oleh pemanggil. */
export function StudentActivityTable({ students, isLoading, isFiltered }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-[11px] uppercase tracking-wide">
            <TableHead className="w-12">No</TableHead>
            <TableHead>Siswa</TableHead>
            <TableHead>Sekolah & kelas</TableHead>
            <TableHead className="text-center">PDF</TableHead>
            <TableHead className="text-center">Audio</TableHead>
            <TableHead className="text-center">Video</TableHead>
            <TableHead>Model dominan</TableHead>
            <TableHead className="text-right">Ritme belajar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={8}>
                  <Skeleton className="h-6 w-full rounded-lg" />
                </TableCell>
              </TableRow>
            ))
          ) : students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <EmptyState
                  icon={BookOpen}
                  title={isFiltered ? "Tidak ada siswa yang cocok" : "Belum ada data aktivitas siswa"}
                  description={isFiltered ? "Ubah kata kunci atau filter model media." : "Data muncul setelah siswa membuka materi di Ruang Belajar."}
                />
              </TableCell>
            </TableRow>
          ) : (
            students.map((student, index) => (
              <TableRow key={student.id}>
                <TableCell className="text-slate-400 tabular-nums">{index + 1}</TableCell>
                <TableCell>
                  <div className="font-semibold text-slate-900">{student.name}</div>
                  <div className="font-mono text-xs text-slate-500">NIS {student.nis ?? "-"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium text-slate-800">{student.school_name ?? "-"}</div>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {student.classroom_name ?? "Belum ada kelas"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <AccessCount icon={FileText} value={student.pdf_access_count} />
                </TableCell>
                <TableCell className="text-center">
                  <AccessCount icon={Volume2} value={student.audio_access_count} />
                </TableCell>
                <TableCell className="text-center">
                  <AccessCount icon={Video} value={student.video_access_count} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{student.dominant_style}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={PACE_TONE[student.learning_pace] ?? "muted"} className="gap-1">
                    <Gauge className="h-3 w-3" aria-hidden="true" />
                    {student.learning_pace}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
