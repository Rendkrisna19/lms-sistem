import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { api, getErrorMessage, getValidationErrors } from "../../lib/api";
import { controlProps, useFormState } from "../../hooks/useFormState";

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
  const { values, bind, errors, setErrors } = useFormState({
    name: teacher?.name ?? "",
    nomor_induk: teacher?.nomor_induk ?? "",
    email: teacher?.email ?? "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Nama wajib diisi.";
    if (!values.nomor_induk.trim()) next.nomor_induk = "NIP wajib diisi.";
    if (!values.email.trim()) next.email = "Email wajib diisi.";
    if (!isEditing && !values.password) next.password = "Kata sandi wajib diisi.";
    else if (values.password && values.password.length < MIN_PASSWORD) next.password = `Kata sandi minimal ${MIN_PASSWORD} karakter.`;
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
      name: values.name.trim(),
      nomor_induk: values.nomor_induk.trim(),
      email: values.email.trim(),
    };
    if (values.password) payload.password = values.password;

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
        <Input {...controlProps("teacher-name", errors.name)} {...bind("name")} placeholder="Contoh: Yulia Rahmawati, S.Pd." autoComplete="off" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="NIP" htmlFor="teacher-nip" required error={errors.nomor_induk}>
          <Input {...controlProps("teacher-nip", errors.nomor_induk)} {...bind("nomor_induk")} placeholder="Nomor Induk Pegawai" className="font-mono" autoComplete="off" />
        </Field>
        <Field label="Email" htmlFor="teacher-email" required error={errors.email}>
          <Input {...controlProps("teacher-email", errors.email)} {...bind("email")} type="email" placeholder="guru@sekolah.sch.id" autoComplete="off" />
        </Field>
      </div>

      <Field
        label={isEditing ? "Kata sandi baru" : "Kata sandi"}
        htmlFor="teacher-password"
        required={!isEditing}
        hint={isEditing ? `Kosongkan jika tidak diubah. Minimal ${MIN_PASSWORD} karakter.` : `Minimal ${MIN_PASSWORD} karakter.`}
        error={errors.password}
      >
        <Input {...controlProps("teacher-password", errors.password)} {...bind("password")} type="password" autoComplete="new-password" />
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
