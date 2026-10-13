import { useState } from "react";
import { toast } from "sonner";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { NativeSelect } from "../ui/native-select";
import { Button } from "../ui/button";
import { api, getErrorMessage, getValidationErrors } from "../../lib/api";
import { controlProps, useFormState } from "../../hooks/useFormState";

const MIN_PASSWORD = 8;

/**
 * Tambah / edit siswa. `classrooms` = daftar kelas sekolah terpilih; `scopeParams` = { school_id } untuk admin master.
 */
export function StudentModal({ isOpen, onClose, onSuccess, studentToEdit = null, classrooms = [], scopeParams = {} }) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={studentToEdit ? "Edit Data Siswa" : "Tambah Siswa Baru"}
      description={studentToEdit ? "Perbarui data akun siswa." : "Daftarkan akun siswa baru di sekolah."}
    >
      <StudentForm
        key={studentToEdit?.id ?? "new"}
        student={studentToEdit}
        classrooms={classrooms}
        onClose={onClose}
        onSuccess={onSuccess}
        scopeParams={scopeParams}
      />
    </Dialog>
  );
}

function StudentForm({ student, classrooms, onClose, onSuccess, scopeParams }) {
  const isEditing = Boolean(student);
  const { values, bind, errors, setErrors } = useFormState({
    name: student?.name ?? "",
    nomor_induk: student?.nomor_induk ?? "",
    email: student?.email ?? "",
    classroom_id: student?.classroom_id ? String(student.classroom_id) : "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Nama wajib diisi.";
    if (!values.nomor_induk.trim()) next.nomor_induk = "NIS wajib diisi.";
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
      classroom_id: values.classroom_id ? Number(values.classroom_id) : null,
    };
    if (values.password) payload.password = values.password;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/admin/students/${student.id}`, payload);
        toast.success(`Data siswa ${payload.name} berhasil diperbarui.`);
      } else {
        await api.post("/admin/students", payload);
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Nama lengkap" htmlFor="student-name" required error={errors.name}>
        <Input {...controlProps("student-name", errors.name)} {...bind("name")} placeholder="Nama lengkap siswa" autoComplete="off" />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="NIS" htmlFor="student-nis" required error={errors.nomor_induk}>
          <Input {...controlProps("student-nis", errors.nomor_induk)} {...bind("nomor_induk")} placeholder="Nomor Induk Siswa" className="font-mono" autoComplete="off" />
        </Field>
        <Field label="Email" htmlFor="student-email" required error={errors.email}>
          <Input {...controlProps("student-email", errors.email)} {...bind("email")} type="email" placeholder="siswa@sekolah.sch.id" autoComplete="off" />
        </Field>
      </div>

      <Field label="Kelas" htmlFor="student-classroom" error={errors.classroom_id} hint="Boleh dikosongkan dan diatur nanti dari halaman Data Kelas.">
        <NativeSelect {...controlProps("student-classroom", errors.classroom_id)} {...bind("classroom_id")}>
          <option value="">Belum ada kelas</option>
          {classrooms.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name} ({c.code})
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field
        label={isEditing ? "Kata sandi baru" : "Kata sandi"}
        htmlFor="student-password"
        required={!isEditing}
        hint={isEditing ? `Kosongkan jika tidak diubah. Minimal ${MIN_PASSWORD} karakter.` : `Minimal ${MIN_PASSWORD} karakter.`}
        error={errors.password}
      >
        <Input {...controlProps("student-password", errors.password)} {...bind("password")} type="password" autoComplete="new-password" />
      </Field>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Simpan Perubahan" : "Tambah Siswa"}
        </Button>
      </div>
    </form>
  );
}
