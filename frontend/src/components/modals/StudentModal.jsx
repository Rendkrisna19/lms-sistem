import React, { useState, useEffect } from "react";
import { X, GraduationCap, Edit3, Mail, Lock, User, Hash, School } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CustomSelect } from "../ui/custom-select";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function StudentModal({ isOpen, onClose, onSuccess, studentToEdit = null, classrooms = [] }) {
  const isEditing = Boolean(studentToEdit);

  const [name, setName] = useState("");
  const [nis, setNis] = useState("");
  const [email, setEmail] = useState("");
  const [classroomId, setClassroomId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name || "");
      setNis(studentToEdit.nomor_induk || studentToEdit.nim_nip || "");
      setEmail(studentToEdit.email || "");
      setClassroomId(studentToEdit.classroom_id || studentToEdit.classroom?.id || "");
      setPassword(""); // Blank by default when editing
    } else {
      setName("");
      setNis("");
      setEmail("");
      setClassroomId(classrooms[0]?.id || "");
      setPassword("password123");
    }
  }, [studentToEdit, isOpen, classrooms]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !nis.trim() || !email.trim()) {
      toast.error("Nama Siswa, NIS, dan Email wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const payload = {
          name: name.trim(),
          nomor_induk: nis.trim(),
          email: email.trim(),
          classroom_id: classroomId || null,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }

        const res = await api.put(`/admin/students/${studentToEdit.id}`, payload);
        if (res.data?.status === "success") {
          toast.success(`Data Siswa ${name} berhasil diperbarui!`);
          onSuccess();
          onClose();
        }
      } else {
        const payload = {
          name: name.trim(),
          nomor_induk: nis.trim(),
          email: email.trim(),
          classroom_id: classroomId || null,
          password: password.trim() || "password123",
        };

        const res = await api.post("/admin/students", payload);
        if (res.data?.status === "success") {
          toast.success(`Siswa ${name} berhasil didaftarkan!`);
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : "Gagal menyimpan data siswa.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-visible animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              {isEditing ? <Edit3 className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Data Siswa / Mahasiswa" : "Tambah Siswa / Mahasiswa Baru"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? "Perbarui informasi peserta belajar resmi di sistem Cendekia"
                  : "Daftarkan akun siswa baru ke sistem akademik Cendekia"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 rounded-full p-1 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Nama Lengkap Siswa
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                required
                placeholder="Contoh: Ahmad Fajar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Nomor Induk Siswa (NIS)
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  placeholder="Contoh: 20241001"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="pl-10 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Alamat Email Siswa
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  placeholder="siswa@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="relative z-20">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Kelas / Rombongan Belajar
            </label>
            <CustomSelect
              value={classroomId}
              onChange={(val) => setClassroomId(val)}
              options={[
                { value: "", label: "Belum Ditetapkan (Non-Kelas)" },
                ...classrooms.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.code})`,
                  description: `Wali Kelas: ${c.homeroom_teacher?.name || "Belum ada"}`,
                })),
              ]}
              placeholder="Pilih Kelas Siswa..."
              icon={School}
            />
          </div>

          <div className="relative z-10">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Kata Sandi {isEditing && <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                placeholder={isEditing ? "••••••••" : "Default: password123"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Action Buttons (Pure Blue!) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 shadow-xs"
            >
              {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Siswa"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
