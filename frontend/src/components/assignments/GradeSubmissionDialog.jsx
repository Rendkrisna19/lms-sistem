import { useEffect, useState } from "react";
import { Download, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { assignmentApi } from "../../features/assignments/api";
import { getErrorMessage } from "../../lib/api";
import { formatDateTime } from "../../lib/datetime";

/** Membaca jawaban satu siswa lalu memberi nilai dan umpan balik. */
export function GradeSubmissionDialog({ open, onClose, onGraded, assignmentId, row, maxScore }) {
  const submission = row?.submission;
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setScore(submission?.score ?? "");
      setFeedback(submission?.feedback ?? "");
      setError("");
    }
  }, [open, submission]);

  const handleSave = async () => {
    const value = Number(score);
    if (score === "" || Number.isNaN(value) || value < 0 || value > maxScore) {
      setError(`Nilai harus antara 0 dan ${maxScore}.`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await assignmentApi.grade(assignmentId, submission.id, { score: value, feedback: feedback.trim() || null });
      toast.success(res.message);
      onGraded?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Nilai belum dapat disimpan."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!isSaving}
      size="lg"
      title={row ? `Jawaban ${row.name}` : "Jawaban siswa"}
      description={submission ? `Dikumpulkan ${formatDateTime(submission.submitted_at)}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Tutup
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={!submission}>
            <Save className="h-4 w-4" aria-hidden="true" />
            Simpan nilai
          </Button>
        </>
      }
    >
      {!submission ? (
        <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Siswa ini belum mengumpulkan tugas.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {submission.is_late && <Badge variant="destructive">Terlambat</Badge>}
            {submission.is_graded && <Badge variant="success">Sudah dinilai</Badge>}
          </div>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Jawaban teks</h3>
            <div className="min-h-20 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
              {submission.answer_text || <span className="text-slate-400">Tidak ada jawaban teks.</span>}
            </div>
          </section>

          {submission.file && (
            <a
              href={submission.file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{submission.file.name}</span>
              </span>
              <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          )}

          <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-[180px_1fr]">
            <Field label={`Nilai (maks. ${maxScore})`} htmlFor="grade-score" required error={error}>
              <Input
                id="grade-score"
                type="number"
                min={0}
                max={maxScore}
                step="0.5"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                disabled={isSaving}
              />
            </Field>
            <Field label="Umpan balik untuk siswa" htmlFor="grade-feedback" hint="Opsional. Siswa dapat membacanya setelah nilai tersimpan.">
              <Textarea id="grade-feedback" rows={3} value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={5000} disabled={isSaving} />
            </Field>
          </div>
        </div>
      )}
    </Dialog>
  );
}
