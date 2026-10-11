import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, School, Edit3, ShieldCheck, Calendar, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CustomSelect } from "../ui/custom-select";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function ClassroomModal({ isOpen, onClose, onSuccess, classToEdit = null, teachers = [] }) {
  const isEditing = Boolean(classToEdit);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [homeroomTeacherId, setHomeroomTeacherId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (classToEdit) {
      setName(classToEdit.name || "");
      setCode(classToEdit.code || "");
      setHomeroomTeacherId(classToEdit.homeroom_teacher_id || (teachers[0]?.id || ""));
      setAcademicYear(classToEdit.academic_year || "2026/2027");
      setDescription(classToEdit.description || "");
    } else {
      setName("");
      setCode("");
      setHomeroomTeacherId(teachers[0]?.id || "");
      setAcademicYear("2026/2027");
      setDescription("");
    }
  }, [classToEdit, isOpen, teachers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Nama Kelas dan Kode Kelas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        homeroom_teacher_id: homeroomTeacherId || null,
        academic_year: academicYear.trim() || "2026/2027",
        description: description.trim(),
      };

      if (isEditing) {
        const res = await api.put(`/admin/classrooms/${classToEdit.id}`, payload);
        if (res.data?.status === "success") {
          toast.success(`Kelas "${name}" berhasil diperbarui!`);
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.post("/admin/classrooms", payload);
        if (res.data?.status === "success") {
          toast.success(`Kelas "${name}" (${code}) berhasil dibuat!`);
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : "Gagal menyimpan data kelas.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-visible animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              {isEditing ? <Edit3 className="h-5 w-5" /> : <School className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Data Kelas / Rombel" : "Tambah Kelas Baru"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? "Perbarui informasi rombongan belajar dan wali kelas"
                  : "Daftarkan rombongan belajar baru untuk alokasi siswa & mapel"}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Nama Kelas / Rombel
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  placeholder="Contoh: Teknik Informatika - A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Kode Kelas
              </label>
              <Input
                required
                placeholder="TI-A"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-xs rounded-xl font-mono uppercase font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-20">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Wali Kelas / Guru Pembina
              </label>
              <CustomSelect
                value={homeroomTeacherId}
                onChange={(val) => setHomeroomTeacherId(val)}
                options={teachers.map((t) => ({
                  value: t.id,
                  label: t.name,
                  description: `NIP: ${t.nomor_induk || t.nim_nip || "-"}`,
                }))}
                placeholder="Pilih Wali Kelas..."
                icon={ShieldCheck}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Tahun Ajaran
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="2026/2027"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="pl-10 text-xs rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Keterangan / Konsentrasi Kelas
            </label>
            <textarea
              rows={2}
              placeholder="Keterangan jurusan, ruang kelas utama, jadwal shift, dll..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons (Strictly Pure Blue!) */}
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
              {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Buat Kelas"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
