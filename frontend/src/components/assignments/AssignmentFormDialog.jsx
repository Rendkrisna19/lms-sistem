import { useEffect, useMemo, useState } from "react";
import { Paperclip, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { NativeSelect } from "../ui/native-select";
import { Switch } from "../ui/switch";
import { assignmentApi } from "../../features/assignments/api";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../lib/datetime";
import { getErrorMessage } from "../../lib/api";

const ACCEPTED_FILES = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png";

function initialValues(assignment, options) {
  const fallbackTarget = options[0] ? `${options[0].classroom_id}:${options[0].course_id}` : "";
  return {
    target: assignment ? `${assignment.classroom?.id}:${assignment.course?.id}` : fallbackTarget,
    title: assignment?.title ?? "",
    instructions: assignment?.instructions ?? "",
    due_at: assignment ? toDateTimeLocalValue(assignment.due_at) : "",
    allow_late: assignment?.allow_late ?? false,
    max_score: assignment?.max_score ?? 100,
    is_active: assignment?.is_active ?? true,
    attachment: null,
    remove_attachment: false,
  };
}

/** Form buat / ubah penugasan: kelas & mapel, tenggat, aturan terlambat, dan lampiran. */
const NO_OPTIONS = [];

export function AssignmentFormDialog({ open, onClose, onSaved, assignment, options = NO_OPTIONS, canWrite = true }) {
  const isEdit = Boolean(assignment);
  const [values, setValues] = useState(() => initialValues(assignment, options));
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(initialValues(assignment, options));
      setErrors({});
    }
  }, [open, assignment, options]);

  const existingAttachment = !values.remove_attachment ? assignment?.attachment : null;
  const targets = useMemo(
    () => options.map((option) => ({ value: `${option.classroom_id}:${option.course_id}`, label: option.label })),
    [options]
  );

  const update = (patch) => setValues((prev) => ({ ...prev, ...patch }));

  const validate = () => {
    const next = {};
    if (!values.target) next.target = "Pilih kelas dan mapel yang Anda ajar.";
    if (!values.title.trim()) next.title = "Judul penugasan wajib diisi.";
    if (!values.due_at) next.due_at = "Tentukan batas waktu pengumpulan.";
    const maxScore = Number(values.max_score);
    if (!Number.isInteger(maxScore) || maxScore < 1 || maxScore > 1000) next.max_score = "Nilai maksimal antara 1 dan 1000.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const [classroomId, courseId] = values.target.split(":");
    const formData = new FormData();
    formData.append("classroom_id", classroomId);
    formData.append("course_id", courseId);
    formData.append("title", values.title.trim());
    formData.append("instructions", values.instructions.trim());
    formData.append("due_at", fromDateTimeLocalValue(values.due_at));
    formData.append("allow_late", values.allow_late ? "1" : "0");
    formData.append("max_score", String(values.max_score));
    formData.append("is_active", values.is_active ? "1" : "0");
    formData.append("remove_attachment", values.remove_attachment ? "1" : "0");
    if (values.attachment) formData.append("attachment", values.attachment);

    setIsSaving(true);
    try {
      const res = isEdit ? await assignmentApi.update(assignment.id, formData) : await assignmentApi.create(formData);
      toast.success(res.message);
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) {
        setErrors(Object.fromEntries(Object.entries(serverErrors).map(([key, messages]) => [key, messages[0]])));
      }
      toast.error(getErrorMessage(err, "Penugasan belum dapat disimpan."));
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
      title={isEdit ? "Ubah penugasan" : "Buat penugasan baru"}
      description="Siswa di kelas terpilih akan melihat penugasan ini beserta batas waktunya."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving} disabled={!canWrite || isSaving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {isEdit ? "Simpan perubahan" : "Terbitkan penugasan"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kelas & mata pelajaran" htmlFor="assignment-target" required error={errors.target} className="sm:col-span-2">
          <NativeSelect
            id="assignment-target"
            value={values.target}
            onChange={(event) => update({ target: event.target.value })}
            options={targets}
            disabled={isSaving || targets.length === 0}
          />
        </Field>

        <Field label="Judul penugasan" htmlFor="assignment-title" required error={errors.title} className="sm:col-span-2">
          <Input id="assignment-title" value={values.title} onChange={(event) => update({ title: event.target.value })} maxLength={255} placeholder="Contoh: Latihan Bab 3 — Pointer" />
        </Field>

        <Field label="Petunjuk pengerjaan" htmlFor="assignment-instructions" hint="Opsional. Jelaskan langkah dan format pengumpulan." className="sm:col-span-2">
          <Textarea id="assignment-instructions" rows={4} value={values.instructions} onChange={(event) => update({ instructions: event.target.value })} maxLength={5000} />
        </Field>

        <Field label="Batas waktu pengumpulan" htmlFor="assignment-due" required error={errors.due_at}>
          <Input id="assignment-due" type="datetime-local" value={values.due_at} onChange={(event) => update({ due_at: event.target.value })} />
        </Field>

        <Field label="Nilai maksimal" htmlFor="assignment-max" required error={errors.max_score}>
          <Input id="assignment-max" type="number" min={1} max={1000} value={values.max_score} onChange={(event) => update({ max_score: event.target.value })} />
        </Field>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:col-span-2">
          <Switch
            checked={values.allow_late}
            onCheckedChange={(checked) => update({ allow_late: checked })}
            label="Terima pengumpulan terlambat"
            description="Jika aktif, siswa tetap dapat mengumpulkan setelah tenggat dan ditandai terlambat."
          />
          <Switch
            checked={values.is_active}
            onCheckedChange={(checked) => update({ is_active: checked })}
            label="Tampilkan ke siswa"
            description="Nonaktifkan untuk menyembunyikan penugasan tanpa menghapusnya."
          />
        </div>

        <div className="space-y-3 sm:col-span-2">
          <p className="text-[13px] font-semibold text-slate-700">Lampiran soal (opsional)</p>
          {existingAttachment && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                <Paperclip className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="truncate">{existingAttachment.name}</span>
              </span>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => update({ remove_attachment: true })}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Hapus
              </Button>
            </div>
          )}
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40">
            <Upload className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-700">
              {values.attachment ? values.attachment.name : existingAttachment ? "Ganti lampiran" : "Pilih berkas"}
            </span>
            <span className="text-xs text-slate-500">PDF, Office, ZIP, JPG, atau PNG · maksimal 10 MB</span>
            <input
              type="file"
              accept={ACCEPTED_FILES}
              className="sr-only"
              onChange={(event) => update({ attachment: event.target.files?.[0] ?? null, remove_attachment: false })}
              disabled={!canWrite}
            />
          </label>
        </div>
      </div>
    </Dialog>
  );
}
