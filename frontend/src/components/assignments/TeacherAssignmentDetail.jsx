import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookCheck, CalendarClock, Clock4, Download, Eye, Hourglass, Paperclip, Users } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { ASSIGNMENT_STATE } from "../../features/assignments/deadline";
import { formatDateTime } from "../../lib/datetime";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { Card } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { StatCard } from "../ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { GradeSubmissionDialog } from "./GradeSubmissionDialog";

function SubmissionStatus({ submission }) {
  if (!submission) return <Badge variant="warning">Belum dikumpulkan</Badge>;
  if (submission.is_graded) return <Badge variant="success">Dinilai</Badge>;
  if (submission.is_late) return <Badge variant="destructive">Terlambat</Badge>;
  return <Badge variant="indigo">Terkumpul</Badge>;
}

/** Detail penugasan dari sisi guru: ringkasan, lampiran, dan daftar pengumpulan per siswa. */
export function TeacherAssignmentDetail({ assignmentId }) {
  const detail = useApiQuery(`/teacher/assignments/${assignmentId}`, { select: (body) => body.data });
  const [gradeRow, setGradeRow] = useState(null);

  if (detail.isLoading && !detail.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (detail.error) {
    return (
      <Alert variant="danger" title="Penugasan tidak dapat dimuat" action={<Button size="sm" variant="outline" onClick={detail.reload}>Coba lagi</Button>}>
        {detail.error}
      </Alert>
    );
  }

  const { assignment, summary, students } = detail.data;
  const state = ASSIGNMENT_STATE[assignment.status_state] ?? ASSIGNMENT_STATE.closed;

  return (
    <div className="space-y-6">
      <Link to="/tugas" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar penugasan
      </Link>

      <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
                {assignment.course?.title}
              </Badge>
              <Badge variant={state.variant}>{state.label}</Badge>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{assignment.title}</h1>
            <p className="text-sm text-slate-500">
              Kelas {assignment.classroom?.name} ({assignment.classroom?.code}) · nilai maksimal {assignment.max_score}
              {assignment.allow_late ? " · menerima terlambat" : " · tanpa pengumpulan terlambat"}
            </p>
          </div>
          <p className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800">
            <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Tenggat {formatDateTime(assignment.due_at)}
          </p>
        </div>

        {assignment.instructions && (
          <div className="mt-5 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-700">
            {assignment.instructions}
          </div>
        )}

        {assignment.attachment && (
          <a
            href={assignment.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Paperclip className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {assignment.attachment.name}
            <Download className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          </a>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Siswa di kelas" value={summary.total_students} icon={Users} />
        <StatCard label="Sudah mengumpulkan" value={`${summary.submitted}/${summary.total_students}`} icon={BookCheck} tone="emerald" />
        <StatCard label="Sudah dinilai" value={summary.graded} icon={BookCheck} tone="indigo" />
        <StatCard label="Terlambat / belum" value={`${summary.late} / ${summary.not_submitted}`} icon={Hourglass} tone="amber" />
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Clock4 className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Pengumpulan siswa
          </h2>
        </div>
        {students.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada siswa di kelas ini" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px] uppercase tracking-wide">
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dikumpulkan</TableHead>
                  <TableHead className="text-center">Nilai</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((row, index) => (
                  <TableRow key={row.student_id}>
                    <TableCell className="tabular-nums text-slate-400">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <div className="font-mono text-xs text-slate-500">{row.nomor_induk ?? "-"}</div>
                    </TableCell>
                    <TableCell>
                      <SubmissionStatus submission={row.submission} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                      {row.submission ? formatDateTime(row.submission.submitted_at) : "–"}
                    </TableCell>
                    <TableCell className="text-center font-bold tabular-nums">
                      {row.submission?.is_graded ? row.submission.score : "–"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant={row.submission ? "secondary" : "ghost"} disabled={!row.submission} onClick={() => setGradeRow(row)}>
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        {row.submission?.is_graded ? "Lihat & ubah nilai" : "Nilai"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <GradeSubmissionDialog
        open={Boolean(gradeRow)}
        onClose={() => setGradeRow(null)}
        onGraded={detail.reload}
        assignmentId={assignment.id}
        maxScore={assignment.max_score}
        row={gradeRow}
      />
    </div>
  );
}
