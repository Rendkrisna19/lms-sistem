import React, { useState, useRef } from "react";
import {
  User,
  Camera,
  Upload,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Save
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import { api, getErrorMessage, getValidationErrors } from "../lib/api";
import { SchoolProfileForm } from "../components/school/SchoolProfileForm";
import { SchoolAdminsCard } from "../components/school/SchoolAdminsCard";

// Curated avatar presets for quick 1-click selection
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
];

export function SettingsPage({ currentUser, onUpdateCurrentUser }) {
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const fileInputRef = useRef(null);

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Notification Preferences
  const [notifyQuiz, setNotifyQuiz] = useState(true);
  const [notifyMaterial, setNotifyMaterial] = useState(true);

  // Handle Photo File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Harap pilih berkas gambar (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (result) {
        setAvatar(result);
        if (onUpdateCurrentUser) {
          onUpdateCurrentUser({
            ...currentUser,
            avatar: result,
          });
        }
        toast.success("Foto profil berhasil diperbarui!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle preset avatar click
  const handleSelectPreset = (url) => {
    setAvatar(url);
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({
        ...currentUser,
        avatar: url,
      });
    }
    toast.success("Foto avatar berhasil diterapkan!");
  };

  // Handle remove avatar
  const handleRemoveAvatar = () => {
    setAvatar("");
    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({
        ...currentUser,
        avatar: "",
      });
    }
    toast.info("Foto profil dihapus (menggunakan inisial nama).");
  };

  // Save profile name & email
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    if (onUpdateCurrentUser) {
      onUpdateCurrentUser({
        ...currentUser,
        name: name.trim(),
        email: email.trim(),
        avatar: avatar,
      });
    }
    try {
      const res = await api.put("/me/profile", { name: name.trim(), email: email.trim() });
      onUpdateCurrentUser?.({ ...currentUser, name: res.data.data.name ?? name.trim(), email: res.data.data.email ?? email.trim() });
      toast.success("Informasi akun berhasil disimpan!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Informasi akun belum dapat disimpan."));
    }
  };

  // Save password change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Mohon lengkapi kata sandi lama dan kata sandi baru.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    try {
      await api.put("/me/password", { current_password: oldPassword, password: newPassword, password_confirmation: confirmPassword });
      toast.success("Kata sandi akun Anda berhasil diperbarui!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const first = Object.values(getValidationErrors(err) ?? {})[0];
      toast.error(first || getErrorMessage(err, "Kata sandi belum dapat diperbarui."));
    }
  };

  const role = currentUser?.role || "murid";

  return (
    <div className="space-y-6 w-full">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Pengaturan Akun & Profil Pengguna
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Perbarui foto profil, identitas pengguna, dan preferensi pembelajaran akun Anda
        </p>
      </div>

      {currentUser?.role === "admin" && (
        <div className="space-y-6">
          <SchoolProfileForm />
          <SchoolAdminsCard currentUserId={currentUser?.id} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Profile Info & Avatar Editor (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Foto Profil */}
          <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="h-4 w-4 text-brand-600" /> Foto Profil Pengguna
              </h3>
              <Badge variant="secondary" className="bg-blue-50 text-brand-700 text-[11px] font-semibold">
                Tampil di Header & Sidebar
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Big Avatar Preview */}
              <div className="relative group shrink-0">
                <Avatar className="h-24 w-24 ring-4 ring-brand-50 shadow-md">
                  {avatar && <AvatarImage src={avatar} alt={name} />}
                  <AvatarFallback className="bg-brand-600 text-white font-extrabold text-2xl">
                    {name ? name.charAt(0) : "U"}
                  </AvatarFallback>
                </Avatar>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-brand-600 text-white shadow-md flex items-center justify-center hover:bg-brand-700 transition-colors cursor-pointer"
                  title="Ganti Foto"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Upload className="h-3.5 w-3.5" /> Unggah Foto Baru
                  </Button>

                  {avatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      className="rounded-xl text-xs gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus Foto
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Format gambar JPG, PNG, atau WebP (maks. 3MB). Foto otomatis tersinkronisasi di header.
                </p>
              </div>
            </div>

            {/* Quick Avatar Presets */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Atau Pilih Avatar Cepat:
              </span>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(presetUrl)}
                    className={`relative rounded-full transition-transform hover:scale-105 cursor-pointer shrink-0 ${
                      avatar === presetUrl ? "ring-3 ring-brand-600 ring-offset-2" : "hover:ring-2 hover:ring-slate-300"
                    }`}
                  >
                    <img
                      src={presetUrl}
                      alt={`Preset ${idx + 1}`}
                      className="h-10 w-10 rounded-full object-cover shadow-xs"
                    />
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Card 2: Form Data Akun */}
          <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="h-4 w-4 text-brand-600" /> Data Identitas Akun
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nama Lengkap
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Lengkap Pengguna"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nomor Induk ({role === "admin" ? "ID Admin" : role === "guru" ? "NIP Guru" : "NIS Siswa"})
                  </label>
                  <Input
                    value={currentUser?.nomor_induk || currentUser?.nim_nip || "-"}
                    disabled
                    className="rounded-xl text-xs bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Alamat Email Terdaftar
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@cendekia.ac.id"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Peran / Hak Akses
                  </label>
                  <div className="h-9 px-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center">
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {role === "admin" ? "Administrator Master" : role === "guru" ? "Guru Pengampu" : "Siswa Belajar"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs px-5 shadow-xs cursor-pointer gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" /> Simpan Identitas
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: Keamanan Kata Sandi & Notifikasi (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Keamanan Kata Sandi */}
          <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="h-4 w-4 text-brand-600" /> Keamanan Kata Sandi
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="rounded-xl text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kata Sandi Baru
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Perbarui Kata Sandi
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 4: Preferensi Notifikasi */}
          <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bell className="h-4 w-4 text-brand-600" /> Preferensi Notifikasi
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Pengumuman Ujian CBT</p>
                  <p className="text-[11px] text-slate-400">Pengingat jadwal pelaksanaan evaluasi</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyQuiz}
                  onChange={(e) => setNotifyQuiz(e.target.checked)}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-semibold text-slate-800">Materi Pembelajaran Baru</p>
                  <p className="text-[11px] text-slate-400">Notifikasi unggahan modul / video</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMaterial}
                  onChange={(e) => setNotifyMaterial(e.target.checked)}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
