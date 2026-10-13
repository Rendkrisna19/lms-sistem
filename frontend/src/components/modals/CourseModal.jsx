import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { NativeSelect } from "../ui/native-select";
import { Button } from "../ui/button";
import { SchoolScopeNotice } from "../admin/SchoolScopeSelect";
import { adminApi } from "../../features/admin/adminApi";
import { useAdminResource } from "../../features/admin/useAdminResource";
import { getErrorMessage, getValidationErrors } from "../../lib/api";
import { controlProps, useFormState } from "../../hooks/useFormState";

/** Tambah / edit mata pelajaran. Daftar guru pengampu mengikuti cakupan sekolah (admin master). */
export function CourseModal({ isOpen, onClose, onSuccess, courseToEdit = null }) {
  if (!isOpen) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      title={courseToEdit ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
      description="Mata pelajaran beserta guru pengampu utamanya."
    >
      <CourseForm course={courseToEdit} onClose={onClose} onSuccess={onSuccess} />
    </Dialog>
  );
}

function CourseForm({ course, onClose, onSuccess }) {
  const isEditing = Boolean(course);
  const { rows: teachers, scope } = useAdminResource("teachers");
  const { values, bind, errors, setErrors } = useFormState({
    title: course?.title ?? "",
    description: course?.description ?? "",
    instructor_id: course?.instructor_id ? String(course.instructor_id) : "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scope.canWrite) return;
    const clientErrors = {};
    if (!values.title.trim()) clientErrors.title = "Nama mata pelajaran wajib diisi.";
    if (!values.instructor_id) clientErrors.instructor_id = "Pilih guru pengampu.";
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      instructor_id: Number(values.instructor_id),
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await adminApi.update("courses", course.id, payload, scope.params);
        toast.success(`Mata pelajaran "${payload.title}" berhasil diperbarui.`);
      } else {
        await adminApi.create("courses", payload, scope.params);
        toast.success(`Mata pelajaran "${payload.title}" berhasil ditambahkan.`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrors(getValidationErrors(err));
      toast.error(getErrorMessage(err, "Gagal menyimpan mata pelajaran."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <SchoolScopeNotice scope={scope} />

      <Field label="Nama mata pelajaran" htmlFor="course-title" required error={errors.title}>
        <Input {...controlProps("course-title", errors.title)} {...bind("title")} placeholder="Contoh: Matematika Wajib" autoComplete="off" />
      </Field>

      <Field
        label="Guru pengampu"
        htmlFor="course-instructor"
        required
        error={errors.instructor_id}
        hint={teachers.length === 0 ? "Belum ada guru di sekolah ini. Tambahkan guru terlebih dahulu." : undefined}
      >
        <NativeSelect {...controlProps("course-instructor", errors.instructor_id)} {...bind("instructor_id")} disabled={teachers.length === 0}>
          <option value="">Pilih guru…</option>
          {teachers.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.name}
              {t.nomor_induk ? ` — NIP ${t.nomor_induk}` : ""}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="Deskripsi" htmlFor="course-description" error={errors.description}>
        <Textarea {...controlProps("course-description", errors.description)} {...bind("description")} rows={3} placeholder="Ringkasan cakupan materi (opsional)" />
      </Field>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!scope.canWrite}>
          {isEditing ? "Simpan Perubahan" : "Tambah Mapel"}
        </Button>
      </div>
    </form>
  );
}
