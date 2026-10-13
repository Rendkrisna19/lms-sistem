import { useState } from "react";
import { toast } from "sonner";
import { IdCard } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { CustomSelect } from "../ui/custom-select";
import { GraduationCap } from "lucide-react";
import { Button } from "../ui/button";
import { FormSection, ProfileFormFields } from "../admin/profile/ProfileFormFields";
import { adminApi } from "../../features/admin/adminApi";
import { useAdminResource } from "../../features/admin/useAdminResource";
import { PERSONAL_KEYS, STUDENT_KEYS, formToPayload, profileToForm } from "../../features/admin/profile";
import { getErrorMessage, getValidationErrors } from "../../lib/api";
import { controlProps, useFormState } from "../../hooks/useFormState";

const MIN_PASSWORD = 8;
const PROFILE_KEYS = [...PERSONAL_KEYS, ...STUDENT_KEYS];

/** Tambah / edit siswa: akun, kelas, data pribadi, dan orang tua. Daftar kelas mengikuti cakupan sekolah. */
export function StudentModal({ isOpen, onClose, onSuccess, studentToEdit = null }) {
  if (!isOpen) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={studentToEdit ? "Edit data siswa" : "Tambah siswa baru"}
      description={studentToEdit ? "Perbarui akun, kelas, dan profil siswa." : "Daftarkan akun dan profil siswa di sekolah."}
    >
      <StudentForm student={studentToEdit} onClose={onClose} onSuccess={onSuccess} />
    </Dialog>
  );
}

function StudentForm({ student, onClose, onSuccess }) {
  const isEditing = Boolean(student);
  const { rows: classrooms, scope } = useAdminResource("classrooms");
  const { values, bind, setValue, errors, setErrors } = useFormState({
    name: student?.name ?? "",
    nomor_induk: student?.nomor_induk ?? student?.nim_nip ?? "",
    email: student?.email ?? "",
    classroom_id: student?.classroom_id ? String(student.classroom_id) : "",
    password: "",
    ...profileToForm(student, PROFILE_KEYS),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const classOptions = [
    { value: "", label: "Belum ada kelas" },
    ...classrooms.map((c) => ({ value: String(c.id), label: c.name, description: c.code })),
  ];

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Nama wajib diisi.";
    if (!values.nomor_induk.trim()) next.nomor_induk = "NIS wajib diisi.";
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
      classroom_id: values.classroom_id ? Number(values.classroom_id) : null,
      ...formToPayload(values, PROFILE_KEYS),
    };
    if (values.password) payload.password = values.password;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await adminApi.update("students", student.id, payload, scope.params);
        toast.success(`Data siswa ${payload.name} berhasil diperbarui.`);
      } else {
        await adminApi.create("students", payload, scope.params);
        toast.success(`Siswa ${payload.name} berhasil ditambahkan.`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrors(getValidationErrors(err));
      toast.error(getErrorMessage(err, "Gagal menyimpan data siswa."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      <FormSection icon={IdCard} title="Akun & kelas" description="Identitas untuk masuk dan kelas tempat siswa belajar.">
        <Field label="Nama lengkap" htmlFor="student-name" required error={errors.name} className="sm:col-span-2">
          <Input {...controlProps("student-name", errors.name)} {...bind("name")} placeholder="Nama lengkap siswa" autoComplete="off" />
        </Field>
        <Field label="NIS" htmlFor="student-nis" required error={errors.nomor_induk}>
          <Input {...controlProps("student-nis", errors.nomor_induk)} {...bind("nomor_induk")} placeholder="Nomor Induk Siswa" className="font-mono" autoComplete="off" />
        </Field>
        <Field label="Email" htmlFor="student-email" required error={errors.email}>
          <Input {...controlProps("student-email", errors.email)} {...bind("email")} type="email" placeholder="siswa@sekolah.sch.id" autoComplete="off" />
        </Field>
        <Field label="Kelas" htmlFor="student-classroom" error={errors.classroom_id} hint="Boleh dikosongkan dan diatur nanti." className="sm:col-span-2">
          <CustomSelect
            id="student-classroom"
            invalid={Boolean(errors.classroom_id)}
            value={values.classroom_id}
            onChange={(value) => setValue("classroom_id", value)}
            placeholder="Belum ada kelas"
            icon={GraduationCap}
            options={classOptions}
          />
        </Field>
        <Field
          label={isEditing ? "Kata sandi baru" : "Kata sandi"}
          htmlFor="student-password"
          required={!isEditing}
          hint={isEditing ? `Kosongkan jika tidak diubah. Minimal ${MIN_PASSWORD} karakter.` : `Minimal ${MIN_PASSWORD} karakter.`}
          error={errors.password}
          className="sm:col-span-2"
        >
          <Input {...controlProps("student-password", errors.password)} {...bind("password")} type="password" autoComplete="new-password" />
        </Field>
      </FormSection>

      <ProfileFormFields role="murid" prefix="student" bind={bind} setValue={setValue} errors={errors} />

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={!scope.canWrite}>
          {isEditing ? "Simpan perubahan" : "Tambah siswa"}
        </Button>
      </div>
    </form>
  );
}
