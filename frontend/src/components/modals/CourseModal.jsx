import React, { useState, useEffect } from "react";
import { X, BookMarked, Edit3, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CustomSelect } from "../ui/custom-select";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function CourseModal({ isOpen, onClose, onSuccess, courseToEdit = null, teachers = [] }) {
  const isEditing = Boolean(courseToEdit);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.title || "");
      setDescription(courseToEdit.description || "");
      setInstructorId(courseToEdit.instructor_id || courseToEdit.instructor?.id || (teachers[0]?.id || ""));
    } else {
      setTitle("");
      setDescription("");
      setInstructorId(teachers[0]?.id || "");
    }
  }, [courseToEdit, isOpen, teachers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Nama Mata Pelajaran wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || "Mata pelajaran kurikulum semester aktif",
        instructor_id: instructorId || (teachers[0]?.id ?? 1),
      };

      if (isEditing) {
        const res = await api.put(`/admin/courses/${courseToEdit.id}`, payload);
        if (res.data?.status === "success") {
          toast.success(`Mata Pelajaran "${title}" berhasil diperbarui!`);
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.post("/admin/courses", payload);
        if (res.data?.status === "success") {
          toast.success(`Mata Pelajaran "${title}" berhasil ditambahkan ke kurikulum!`);
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : "Gagal menyimpan mata pelajaran.");
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
              {isEditing ? <Edit3 className="h-5 w-5" /> : <BookMarked className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Mata Pelajaran / Silabus" : "Tambah Mata Pelajaran Baru"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? "Perbarui informasi silabus dan guru pengampu aktif"
                  : "Daftarkan mata pelajaran baru ke kurikulum sekolah aktif"}
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
              Nama Mata Pelajaran
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                required
                placeholder="Contoh: Algoritma & Struktur Data"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="pl-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Deskripsi Silabus / Materi
            </label>
            <textarea
              rows={3}
              placeholder="Ringkasan cakupan materi pembelajaran, konsep praktikum, dsb..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="relative z-20">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Guru Pengampu Resmi
            </label>
            <CustomSelect
              value={instructorId}
              onChange={(val) => setInstructorId(val)}
              options={teachers.map((t) => ({
                value: t.id,
                label: t.name,
                description: `NIP: ${t.nomor_induk || t.nim_nip || "-"}`,
                icon: GraduationCap,
              }))}
              placeholder="Pilih Guru Pengampu..."
              icon={GraduationCap}
            />
          </div>

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
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 shadow-sm"
            >
              {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Mapel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
