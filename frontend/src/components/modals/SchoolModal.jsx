import React, { useState, useEffect } from "react";
import { X, Building2, Edit3, Mail, Phone, MapPin, Hash, CheckCircle2, UserCheck, Key, User } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CustomSelect } from "../ui/custom-select";
import { adminApi } from "../../features/admin/adminApi";
import { toast } from "sonner";

export function SchoolModal({ isOpen, onClose, onSuccess, schoolToEdit = null }) {
  const isEditing = Boolean(schoolToEdit);

  const [name, setName] = useState("");
  const [npsn, setNpsn] = useState("");
  const [jenjang, setJenjang] = useState("SMA");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("active");

  // Akun Admin Sekolah
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminNip, setAdminNip] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schoolToEdit) {
      setName(schoolToEdit.name || "");
      setNpsn(schoolToEdit.npsn || "");
      setJenjang(schoolToEdit.jenjang || "SMA");
      setAddress(schoolToEdit.address || "");
      setPhone(schoolToEdit.phone || "");
      setEmail(schoolToEdit.email || "");
      setStatus(schoolToEdit.status || "active");
      setAdminName(schoolToEdit.admin?.name || "");
      setAdminEmail(schoolToEdit.admin?.email || "");
      setAdminNip(schoolToEdit.admin?.nomor_induk || schoolToEdit.admin?.nim_nip || "");
      setAdminPassword("");
    } else {
      setName("");
      setNpsn("");
      setJenjang("SMA");
      setAddress("");
      setPhone("");
      setEmail("");
      setStatus("active");
      setAdminName("");
      setAdminEmail("");
      setAdminNip("");
      setAdminPassword("");
    }
  }, [schoolToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama Sekolah wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        npsn: npsn.trim() || null,
        jenjang: jenjang || "SMA",
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        status: status || "active",
        admin_name: adminName.trim() || null,
        admin_email: adminEmail.trim() || null,
        admin_password: adminPassword || null,
        admin_nip: adminNip.trim() || null,
      };

      if (isEditing) {
        const res = await adminApi.update("schools", schoolToEdit.id, payload);
        if (res?.status === "success") {
          toast.success(`Data sekolah "${name}" berhasil diperbarui.`);
          onSuccess();
          onClose();
        }
      } else {
        const res = await adminApi.create("schools", payload);
        if (res?.status === "success") {
          toast.success(`Sekolah baru "${name}" berhasil didaftarkan di Cendekia!`);
          onSuccess();
          onClose();
        }
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.npsn?.[0] ||
        err.response?.data?.message ||
        "Gagal menyimpan data sekolah. Periksa kembali form isian.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const jenjangOptions = [
    { value: "SMA", label: "SMA (Sekolah Menengah Atas)" },
    { value: "SMK", label: "SMK (Sekolah Menengah Kejuruan)" },
    { value: "SMP", label: "SMP (Sekolah Menengah Pertama)" },
    { value: "SD", label: "SD (Sekolah Dasar)" },
    { value: "Madrasah", label: "MA / MTs / Pesantren" },
    { value: "Lainnya", label: "Institusi Lainnya" },
  ];

  const statusOptions = [
    { value: "active", label: "Aktif (Dapat Digunakan)" },
    { value: "inactive", label: "Nonaktif (Ditangguhkan)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              {isEditing ? <Edit3 className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? "Edit Data Sekolah" : "Tambah Data Sekolah"}
              </h3>
              <p className="text-xs text-slate-500">
                Lengkapi informasi data sekolah di bawah ini.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nama Sekolah */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Sekolah <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="h-4 w-4" />
              </div>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: SMA Mitra Inalum"
                className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Grid NPSN & Jenjang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NPSN (Nomor Pokok Sekolah)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="h-4 w-4" />
                </div>
                <Input
                  type="text"
                  value={npsn}
                  onChange={(e) => setNpsn(e.target.value)}
                  placeholder="Contoh: 10203040"
                  className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm font-mono"
                />
              </div>
            </div>

            <div className="relative z-30">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jenjang Pendidikan
              </label>
              <CustomSelect
                value={jenjang}
                onChange={(val) => setJenjang(val)}
                options={jenjangOptions}
                placeholder="Pilih Jenjang"
                searchable={false}
              />
            </div>
          </div>

          {/* Grid Kontak & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                No. Telepon / WhatsApp
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <Input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: (0622) 697888"
                  className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Sekolah
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contoh: info@mitrainalum.sch.id"
                  className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Alamat Lengkap Sekolah
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Kompleks Perumahan PT Inalum, Tanjung Gading, Kab. Batu Bara"
                rows={2}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm resize-none"
              />
            </div>
          </div>

          {/* Akun Login Admin Sekolah */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <span>Akun Login Admin Sekolah</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Akun ini digunakan admin sekolah untuk login dan mengelola guru, siswa, kelas, dan mapel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Admin Sekolah
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Contoh: Admin SMA Mitra Inalum"
                    className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Login Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Contoh: admin@sekolah.sch.id"
                    className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEditing ? "Password Baru (Opsional)" : "Password Login"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder={isEditing ? "Kosongkan jika tidak diubah" : "Default: password123"}
                    className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  NIP / Kode Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    value={adminNip}
                    onChange={(e) => setAdminNip(e.target.value)}
                    placeholder="Contoh: ADMIN001"
                    className="pl-10 h-10 rounded-xl border-slate-200 focus-visible:ring-blue-600 text-xs sm:text-sm bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Tenant */}
          <div className="relative z-20">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status Operasional
            </label>
            <CustomSelect
              value={status}
              onChange={(val) => setStatus(val)}
              options={statusOptions}
              placeholder="Status Sekolah"
              searchable={false}
              icon={CheckCircle2}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 cursor-pointer text-xs"
            >
              {isSubmitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Sekolah"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
