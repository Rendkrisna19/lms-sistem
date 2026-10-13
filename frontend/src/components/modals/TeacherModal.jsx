import { useState } from "react";
import { toast } from "sonner";
import { IdCard } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FormSection, ProfileFormFields } from "../admin/profile/ProfileFormFields";
import { adminApi } from "../../features/admin/adminApi";
import { PERSONAL_KEYS, TEACHER_KEYS, formToPayload, profileToForm } from "../../features/admin/profile";
import { useSchoolScope } from "../../hooks/useSchoolScope";
import { getErrorMessage, getValidationErrors } from "../../lib/api";
import { controlProps, useFormState } from "../../hooks/useFormState";

const MIN_PASSWORD = 8;
const PROFILE_KEYS = [...PERSONAL_KEYS, ...TEACHER_KEYS];

/** Tambah / edit guru: akun, data pribadi, dan pendidikan. Penyimpanan memakai cakupan sekolah (admin master). */
export function TeacherModal({ isOpen, onClose, onSuccess, teacherToEdit = null }) {
  if (!isOpen) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={teacherToEdit ? "Edit data guru" : "Tambah guru baru"}
      description={teacherToEdit ? "Perbarui akun dan profil guru." : "Daftarkan akun dan profil guru di sekolah."}
    >
      <TeacherForm teacher={teacherToEdit} onClose={onClose} onSuccess={onSuccess} />
    </Dialog>
  );
}

function TeacherForm({ teacher, onClose, onSuccess }) {
  const isEditing = Boolean(teacher);
  const scope = useSchoolScope();
  const { values, bind, setValue, errors, setErrors } = useFormState({
    name: teacher?.name ?? "",
    nomor_induk: teacher?.nomor_induk ?? teacher?.nim_nip ?? "",
    email: teacher?.email ?? "",
    password: "",
    ...profileToForm(teacher, PROFILE_KEYS),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Nama wajib diisi.";
    if (!values.nomor_induk.trim()) next.nomor_induk = "NIP wajib diisi.";
    if (!values.email.trim()) next.email = "Email wajib diisi.";
    if (!isEditing && !values.password) next.password = "Kata sandi wajib diisi.";
    else if (values.password && values.password.length < MIN_PASSWORD) next.password = `Kata sandi minimal ${MIN_PASSWORD} karakter.`;
    if (values.birth_date && values.birth_date >= new Date().toISOString().slice(0, 10)) next.birth_date = "Tanggal lahir harus sebelum hari ini.";
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!scope.canWrite) return;
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }

    const payload = {
      name: values.name.trim(),
      nomor_induk: values.nomor_induk.trim(),
      email: values.email.trim(),
      ...formToPayload(values, PROFILE_KEYS),
    };
    if (values.password) payload.password = values.password;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await adminApi.update("teachers", teacher.id, payload, scope.params);
        toast.success(`Data guru ${payload.name} berhasil diperbarui.`);
      } else {
        await adminApi.create("teachers", payload, scope.params);
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
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      <FormSection icon={IdCard} title="Akun guru" description="Identitas dan kredensial untuk masuk ke sistem.">
        <Field label="Nama lengkap" htmlFor="teacher-name" required error={errors.name} className="sm:col-span-2">
          <Input {...controlProps("teacher-name", errors.name)} {...bind("name")} placeholder="Contoh: Yulia Rahmawati, S.Pd." autoComplete="off" />
        </Field>
        <Field label="NIP" htmlFor="teacher-nip" required error={errors.nomor_induk}>
          <Input {...controlProps("teacher-nip", errors.nomor_induk)} {...bind("nomor_induk")} placeholder="Nomor Induk Pegawai" className="font-mono" autoComplete="off" />
        </Field>
        <Field label="Email" htmlFor="teacher-email" required error={errors.email}>
          <Input {...controlProps("teacher-email", errors.email)} {...bind("email")} type="email" placeholder="guru@sekolah.sch.id" autoComplete="off" />
        </Field>
        <Field
          label={isEditing ? "Kata sandi baru" : "Kata sandi"}
          htmlFor="teacher-password"
          required={!isEditing}
          hint={isEditing ? `Kosongkan jika tidak diubah. Minimal ${MIN_PASSWORD} karakter.` : `Minimal ${MIN_PASSWORD} karakter.`}
          error={errors.password}
          className="sm:col-span-2"
        >
          <Input {...controlProps("teacher-password", errors.password)} {...bind("password")} type="password" autoComplete="new-password" />
        </Field>
      </FormSection>

      <ProfileFormFields role="guru" prefix="teacher" bind={bind} setValue={setValue} errors={errors} />

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!scope.canWrite}>
          {isEditing ? "Simpan perubahan" : "Tambah guru"}
        </Button>
      </div>
    </form>
  );
}
