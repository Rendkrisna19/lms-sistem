import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { api, getErrorMessage, getValidationErrors } from "../../lib/api";

const MIN_PASSWORD = 8;

/**
 * Tambah / edit guru. `scopeParams` berisi { school_id } untuk admin master (kosong untuk admin sekolah).
 */
export function TeacherModal({ isOpen, onClose, onSuccess, teacherToEdit = null, scopeParams = {} }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={teacherToEdit ? "Edit Data Guru" : "Tambah Guru Baru"}
      description={teacherToEdit ? "Perbarui data akun guru." : "Daftarkan akun guru baru di sekolah."}
    >
      <TeacherForm key={teacherToEdit?.id ?? "new"} teacher={teacherToEdit} onClose={onClose} onSuccess={onSuccess} scopeParams={scopeParams} />
    </Dialog>
  );
}

function TeacherForm({ teacher, onClose, onSuccess, scopeParams }) {
  const isEditing = Boolean(teacher);
  const [form, setForm] = useState(() => ({
    name: teacher?.name ?? "",
    nomor_induk: teacher?.nomor_induk ?? "",
    email: teacher?.email ?? "",
    password: "",
  }));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Nama wajib diisi.";
    if (!form.nomor_induk.trim()) next.nomor_induk = "NIP wajib diisi.";
    if (!form.email.trim()) next.email = "Email wajib diisi.";
    if (!isEditing && !form.password) next.password = "Kata sandi wajib diisi.";
    if (form.password && form.password.length < MIN_PASSWORD) next.password = `Kata sandi minimal ${MIN_PASSWORD} karakter.`;
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      ...scopeParams,
      name: form.name.trim(),
      nomor_induk: form.nomor_induk.trim(),
      email: form.email.trim(),
    };
    if (form.password) payload.password = form.password;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/admin/teachers/${teacher.id}`, payload);
        toast.success(`Data guru ${payload.name} berhasil diperbarui.`);
      } else {
        await api.post("/admin/teachers", payload);
        toast.success(`Guru ${payload.name} berhasil ditambahkan.`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrors(getValidationErrors(err));
      toast.error(getErrorMessage(err, "Gagal menyimpan data guru."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Nama lengkap" htmlFor="teacher-name" required error={errors.name}>
        <Input
          id="teacher-name"
          value={form.name}
          onChange={setField("name")}
          placeholder="Contoh: Yulia Rahmawati, S.Pd."
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "teacher-name-error" : undefined}
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="NIP" htmlFor="teacher-nip" required error={errors.nomor_induk}>
          <Input
            id="teacher-nip"
            value={form.nomor_induk}
            onChange={setField("nomor_induk")}
            placeholder="Nomor Induk Pegawai"
            className="font-mono"
            aria-invalid={Boolean(errors.nomor_induk)}
            aria-describedby={errors.nomor_induk ? "teacher-nip-error" : undefined}
            autoComplete="off"
          />
        </Field>
        <Field label="Email" htmlFor="teacher-email" required error={errors.email}>
          <Input
            id="teacher-email"
            type="email"
            value={form.email}
            onChange={setField("email")}
            placeholder="guru@sekolah.sch.id"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "teacher-email-error" : undefined}
            autoComplete="off"
          />
        </Field>
      </div>

      <Field
        label={isEditing ? "Kata sandi baru" : "Kata sandi"}
        htmlFor="teacher-password"
        required={!isEditing}
        hint={isEditing ? `Kosongkan jika tidak diubah. Minimal ${MIN_PASSWORD} karakter.` : `Minimal ${MIN_PASSWORD} karakter.`}
        error={errors.password}
      >
        <Input
          id="teacher-password"
          type="password"
          value={form.password}
          onChange={setField("password")}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "teacher-password-error" : undefined}
        />
      </Field>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Simpan Perubahan" : "Tambah Guru"}
        </Button>
      </div>
    </form>
  );
}
