import { Link } from "react-router-dom";
import { BarChart3, CalendarClock, Clock, Pencil, Power, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Skeleton } from "../../ui/skeleton";
import { Badge } from "../../ui/badge";
import { Button, buttonVariants } from "../../ui/button";
import { QuizStatusBadge } from "../QuizStatusBadge";
import { formatDateTime } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";

function ScheduleCell({ quiz }) {
  if (!quiz.starts_at && !quiz.ends_at) {
    return <span className="text-xs text-slate-400">Tanpa jadwal</span>;
  }
  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-1.5 text-slate-700">
        <CalendarClock className="h-3.5 w-3.5 text-brand-600 shrink-0" aria-hidden="true" />
        <span>{quiz.starts_at ? formatDateTime(quiz.starts_at) : "Dibuka sekarang"}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-500">
        <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden="true" />
        <span>s/d {quiz.ends_at ? formatDateTime(quiz.ends_at) : "tanpa batas"}</span>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return Array.from({ length: 4 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-32 mt-2" />
      </TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-8 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
    </TableRow>
  ));
}

export function QuizTable({ quizzes, isLoading, togglingId, onToggle, onDelete, emptyState }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-[11px] uppercase tracking-wide">
            <TableHead>Ujian</TableHead>
            <TableHead>Kelas</TableHead>
            <TableHead>Jadwal</TableHead>
            <TableHead>Durasi & KKM</TableHead>
            <TableHead>Pengerjaan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : quizzes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>{emptyState}</TableCell>
            </TableRow>
          ) : (
            quizzes.map((quiz) => (
              <TableRow key={quiz.id} className={cn("hover:bg-slate-50/70", !quiz.is_active && "bg-slate-50/50")}>
                <TableCell className="max-w-sm">
                  <Link to={`/ujian/${quiz.id}`} className="font-semibold text-slate-900 hover:text-brand-700 hover:underline line-clamp-2">
                    {quiz.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-brand-700 font-medium">{quiz.course?.title}</span>
                    <span aria-hidden="true">•</span>
                    <span>{quiz.total_questions} soal</span>
                    <span aria-hidden="true">•</span>
                    <span>{quiz.total_points} poin</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm font-medium text-slate-800">{quiz.classroom?.name ?? "-"}</div>
                  {quiz.classroom?.code && (
                    <Badge variant="muted" className="mt-1 font-mono text-[10px]">
                      {quiz.classroom.code}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <ScheduleCell quiz={quiz} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  <div className="font-semibold text-slate-800">{quiz.duration_minutes} menit</div>
                  <div className="text-emerald-700">KKM {quiz.passing_score}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs">
                  <div className="font-semibold text-slate-800">{quiz.total_attempts} siswa</div>
                  <div className="text-slate-500">
                    {quiz.average_score !== null && quiz.average_score !== undefined ? `Rata-rata ${quiz.average_score}` : "Belum ada nilai"}
                  </div>
                </TableCell>
                <TableCell>
                  <QuizStatusBadge status={quiz.status_state} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/ujian/${quiz.id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm", className: "text-brand-700 hover:bg-brand-50" })}
                    >
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden xl:inline">Detail</span>
                    </Link>
                    <Link
                      to={`/ujian/${quiz.id}/edit`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label={`Edit ${quiz.title}`}
                      title="Edit ujian & soal"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onToggle(quiz)}
                      isLoading={togglingId === quiz.id}
                      aria-label={quiz.is_active ? `Nonaktifkan ${quiz.title}` : `Aktifkan ${quiz.title}`}
                      title={quiz.is_active ? "Nonaktifkan" : "Aktifkan"}
                      className={quiz.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400"}
                    >
                      {togglingId !== quiz.id && <Power className="h-3.5 w-3.5" aria-hidden="true" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(quiz)}
                      aria-label={`Hapus ${quiz.title}`}
                      title="Hapus ujian"
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
