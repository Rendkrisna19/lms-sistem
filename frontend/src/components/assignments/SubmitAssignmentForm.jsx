import { useState } from "react";
import { Paperclip, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Textarea } from "../ui/textarea";
import { Alert } from "../ui/alert";
import { assignmentApi } from "../../features/assignments/api";
import { getErrorMessage } from "../../lib/api";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png";

/** Form pengumpulan tugas: jawaban teks dan/atau berkas. Berkas baru menggantikan berkas lama. */
export function SubmitAssignmentForm({ assignmentId, initialText = "", currentFile, canSubmit, isLate, onSubmitted }) {
  const [text, setText] = useState(initialText);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!text.trim() && !file && !currentFile) {
      setError("Tulis jawaban atau unggah berkas terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("answer_text", text.trim());
    if (file) formData.append("file", file);

    setIsSaving(true);
    try {
      const res = await assignmentApi.submit(assignmentId, formData);
      toast.success(res.message);
      setFile(null);
      onSubmitted?.();
    } catch (err) {
      setError(getErrorMessage(err, "Tugas belum dapat dikumpulkan."));
    } finally {
      setIsSaving(false);
    }
  };

  if (!canSubmit) {
    return <Alert variant="info" title="Pengumpulan ditutup">Tenggat sudah lewat dan guru tidak menerima pengumpulan terlambat.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {isLate && (
        <Alert variant="warning" title="Anda mengumpulkan setelah tenggat">
          Pengumpulan ini akan ditandai terlambat.
        </Alert>
      )}

      <Field label="Jawaban" htmlFor="submission-text" hint="Tulis jawaban atau catatan untuk guru. Boleh dikosongkan bila mengunggah berkas.">
        <Textarea id="submission-text" rows={7} value={text} onChange={(event) => setText(event.target.value)} maxLength={20000} disabled={isSaving} />
      </Field>

      <div className="space-y-2.5">
        <p className="text-[13px] font-semibold text-slate-700">Berkas jawaban (opsional)</p>
        {currentFile && !file && (
          <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
            <Paperclip className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            Berkas terkumpul: <span className="font-semibold text-slate-800">{currentFile.name}</span>
          </p>
        )}
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-4 transition-colors hover:border-brand-400 hover:bg-brand-50/40">
          <Upload className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
          <span className="min-w-0 text-sm">
            <span className="block truncate font-semibold text-slate-700">{file ? file.name : currentFile ? "Ganti berkas" : "Pilih berkas"}</span>
            <span className="text-xs text-slate-500">PDF, Office, ZIP, JPG, atau PNG · maksimal 10 MB</span>
          </span>
          <input type="file" accept={ACCEPTED_FILES} className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={isSaving} />
        </label>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" size="lg" isLoading={isSaving} disabled={isSaving}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {currentFile || initialText ? "Perbarui pengumpulan" : "Kumpulkan tugas"}
        </Button>
      </div>
    </form>
  );
}
