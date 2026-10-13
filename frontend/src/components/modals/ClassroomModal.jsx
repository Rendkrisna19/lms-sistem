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

/** Tahun ajaran berjalan, mis. "2026/2027" (Juli = awal tahun ajaran). */
function currentAcademicYear() {
  const now = new Date();
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}/${start + 1}`;
}

/** Tambah / edit kelas. Daftar wali kelas dan penyimpanan mengikuti cakupan sekolah (admin master). */
export function ClassroomModal({ isOpen, onClose, onSuccess, classToEdit = null }) {
  if (!isOpen) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      title={classToEdit ? "Edit Data Kelas" : "Tambah Kelas Baru"}
      description={classToEdit ? "Perbarui informasi kelas dan wali kelas." : "Daftarkan kelas baru untuk penempatan siswa dan mata pelajaran."}
    >
      <ClassroomForm classroom={classToEdit} onClose={onClose} onSuccess={onSuccess} />
    </Dialog>
  );
}

function ClassroomForm({ classroom, onClose, onSuccess }) {
  const isEditing = Boolean(classroom);
  const { rows: teachers, scope } = useAdminResource("teachers");
  const { values, bind, errors, setErrors } = useFormState({
    name: classroom?.name ?? "",
    code: classroom?.code ?? "",
    homeroom_teacher_id: classroom?.homeroom_teacher_id ? String(classroom.homeroom_teacher_id) : "",
    academic_year: classroom?.academic_year ?? currentAcademicYear(),
    description: classroom?.description ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scope.canWrite) return;
    const clientErrors = {};
    if (!values.name.trim()) clientErrors.name = "Nama kelas wajib diisi.";
    if (!values.code.trim()) clientErrors.code = "Kode kelas wajib diisi.";
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      homeroom_teacher_id: values.homeroom_teacher_id ? Number(values.homeroom_teacher_id) : null,
      academic_year: values.academic_year.trim() || null,
      description: values.description.trim() || null,
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await adminApi.update("classrooms", classroom.id, payload, scope.params);
        toast.success(`Kelas "${payload.name}" berhasil diperbarui.`);
      } else {
        await adminApi.create("classrooms", payload, scope.params);
        toast.success(`Kelas "${payload.name}" berhasil dibuat.`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrors(getValidationErrors(err));
      toast.error(getErrorMessage(err, "Gagal menyimpan data kelas."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <SchoolScopeNotice scope={scope} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Nama kelas" htmlFor="classroom-name" required error={errors.name} className="sm:col-span-2">
          <Input {...controlProps("classroom-name", errors.name)} {...bind("name")} placeholder="Contoh: X IPA 1" autoComplete="off" />
        </Field>
        <Field label="Kode" htmlFor="classroom-code" required error={errors.code}>
          <Input {...controlProps("classroom-code", errors.code)} {...bind("code")} placeholder="X-IPA-1" className="font-mono uppercase" autoComplete="off" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Wali kelas" htmlFor="classroom-homeroom" error={errors.homeroom_teacher_id}>
          <NativeSelect {...controlProps("classroom-homeroom", errors.homeroom_teacher_id)} {...bind("homeroom_teacher_id")}>
            <option value="">Belum ditentukan</option>
            {teachers.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Tahun ajaran" htmlFor="classroom-year" error={errors.academic_year}>
          <Input {...controlProps("classroom-year", errors.academic_year)} {...bind("academic_year")} placeholder="2026/2027" className="font-mono" />
        </Field>
      </div>

      <Field label="Keterangan" htmlFor="classroom-description" error={errors.description}>
        <Textarea {...controlProps("classroom-description", errors.description)} {...bind("description")} rows={2} placeholder="Jurusan, ruang utama, dsb. (opsional)" />
      </Field>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!scope.canWrite}>
          {isEditing ? "Simpan Perubahan" : "Buat Kelas"}
        </Button>
      </div>
    </form>
  );
}
