import React, { useState, useEffect } from "react";
import { X, UserPlus, Edit3, ShieldCheck, Mail, Lock, User } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function TeacherModal({ isOpen, onClose, onSuccess, teacherToEdit = null }) {
  const isEditing = Boolean(teacherToEdit);

  const [name, setName] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teacherToEdit) {
      setName(teacherToEdit.name || "");
      setNip(teacherToEdit.nomor_induk || teacherToEdit.nim_nip || "");
      setEmail(teacherToEdit.email || "");
      setPassword(""); // Blank by default when editing
    } else {
      setName("");
      setNip("");
      setEmail("");
      setPassword("password123");
    }
  }, [teacherToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !nip.trim() || !email.trim()) {
      toast.error("Nama Lengkap, NIP, dan Email wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const payload = {
          name: name.trim(),
          nomor_induk: nip.trim(),
          email: email.trim(),
        };
        if (password.trim()) {
          payload.password = password.trim();
        }

        const res = await api.put(`/admin/teachers/${teacherToEdit.id}`, payload);
        if (res.data?.status === "success") {
          toast.success(`Data Guru ${name} berhasil diperbarui!`);
          onSuccess();
          onClose();
        }
      } else {
        const payload = {
          name: name.trim(),
          nomor_induk: nip.trim(),
          email: email.trim(),
          password: password.trim() || "password123",
        };

        const res = await api.post("/admin/teachers", payload);
        if (res.data?.status === "success") {
          toast.success(`Guru ${name} berhasil ditambahkan ke database!`);
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : "Gagal menyimpan data guru.");
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
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-brand-600 flex items-center justify-center font-bold">
              {isEditing ? <Edit3 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Data Guru / Dosen" : "Tambah Guru / Dosen Baru"}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? "Perbarui informasi tenaga pengajar resmi di sistem Cendekia"
                  : "Daftarkan akun pengampu baru ke sistem akademik Cendekia"}
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
              Nama Lengkap & Gelar
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                required
                placeholder="Contoh: Ibu Yulia, M.Kom."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Nomor Induk Pegawai (NIP)
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  required
                  placeholder="18 digit NIP"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="pl-10 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          <div>
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
              className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs px-5 shadow-sm"
            >
              {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Guru"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
