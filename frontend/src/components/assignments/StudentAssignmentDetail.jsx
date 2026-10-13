import { Link } from "react-router-dom";
import { ArrowLeft, Award, CalendarClock, Download, MessageSquareText, Paperclip, UserRound } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { SUBMISSION_STATE, deadlineTone, timeUntil } from "../../features/assignments/deadline";
import { useNow } from "../../features/assignments/useNow";
import { formatDateTime } from "../../lib/datetime";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { SubmitAssignmentForm } from "./SubmitAssignmentForm";

/** Detail tugas dari sisi siswa: petunjuk, lampiran guru, status pengumpulan, nilai, dan form kumpul. */
export function StudentAssignmentDetail({ assignmentId }) {
  const detail = useApiQuery(`/student/assignments/${assignmentId}`, { select: (body) => body.data });
  const now = useNow();

  if (detail.isLoading && !detail.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (detail.error) {
    return (
      <Alert variant="danger" title="Tugas tidak dapat dibuka" action={<Button size="sm" variant="outline" onClick={detail.reload}>Coba lagi</Button>}>
        {detail.error}
      </Alert>
    );
  }

  const { assignment, submission } = detail.data;
  const stateKey = submission ? submission.state : "none";
  const state = SUBMISSION_STATE[stateKey];
  const remaining = timeUntil(assignment.due_at, now);
  const tone = deadlineTone(assignment.due_at, now);
  const isGraded = submission?.state === "graded";

  return (
    <div className="space-y-6">
      <Link to="/tugas" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar tugas
      </Link>

      <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
            {assignment.course_title}
          </Badge>
          <Badge variant={state.variant}>{state.label}</Badge>
        </div>
        <h1 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">{assignment.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          {assignment.teacher_name} · Kelas {assignment.classroom?.name}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div
            className={cn(
              "rounded-2xl border p-4 sm:col-span-2",
              tone === "red" && assignment.can_submit && "border-red-200 bg-red-50/60",
              tone === "amber" && assignment.can_submit && "border-amber-200 bg-amber-50/60",
              (tone === "slate" || !assignment.can_submit) && "border-slate-200 bg-slate-50/60"
            )}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Tenggat {formatDateTime(assignment.due_at)}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {assignment.can_submit
                ? remaining
                  ? `Sisa waktu ${remaining}${assignment.allow_late ? " · pengumpulan terlambat diterima" : ""}`
                  : "Tenggat sudah lewat, pengumpulan terlambat diterima"
                : "Pengumpulan sudah ditutup"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              Nilai
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-900">
              {isGraded ? submission.score : "–"}
              <span className="text-sm font-semibold text-slate-400"> / {assignment.max_score}</span>
            </p>
          </div>
        </div>

        {assignment.instructions && (
          <section className="mt-6">
            <h2 className="text-sm font-bold text-slate-900">Petunjuk dari guru</h2>
            <p className="mt-2 whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{assignment.instructions}</p>
          </section>
        )}

        {assignment.attachment && (
          <a
            href={assignment.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            {assignment.attachment.name}
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </Card>

      {isGraded && submission.feedback && (
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50/50 p-5 shadow-none">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            Umpan balik guru
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-emerald-950">{submission.feedback}</p>
        </Card>
      )}

      <Card className="rounded-3xl border-slate-200 p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">
            {submission ? "Pengumpulan Anda" : "Kumpulkan tugas"}
          </h2>
          {submission && (
            <span className="text-xs text-slate-500">
              Terakhir dikumpulkan {formatDateTime(submission.submitted_at)}
            </span>
          )}
        </div>

        {isGraded ? (
          <div className="space-y-3">
            {submission.answer_text && <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm text-slate-800">{submission.answer_text}</p>}
            {submission.file && (
              <a href={submission.file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-700 underline-offset-4 hover:underline">
                {submission.file.name}
              </a>
            )}
            <p className="text-xs text-slate-500">Tugas sudah dinilai dan tidak dapat diubah.</p>
          </div>
        ) : (
          <SubmitAssignmentForm
            assignmentId={assignment.id}
            initialText={submission?.answer_text ?? ""}
            currentFile={submission?.file ?? null}
            canSubmit={assignment.can_submit}
            isLate={assignment.can_submit && assignment.status_state === "late"}
            onSubmitted={detail.reload}
          />
        )}
      </Card>
    </div>
  );
}
