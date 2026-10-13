import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, GraduationCap, Crown, ShieldCheck, FileText, Volume2, Video, Building2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";
import { toast } from "sonner";

// Tombol isi-otomatis akun demo hanya untuk pengembangan lokal (VITE_SHOW_DEMO_ACCOUNTS=true)
const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [nomorIndukInput, setNomorIndukInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field-specific error states
  const [fieldErrors, setFieldErrors] = useState({
    nomor_induk: null,
    password: null,
  });
  const [generalError, setGeneralError] = useState(null);

  const handleNomorIndukChange = (e) => {
    setNomorIndukInput(e.target.value);
    if (fieldErrors.nomor_induk) {
      setFieldErrors((prev) => ({ ...prev, nomor_induk: null }));
    }
    if (generalError) setGeneralError(null);
  };

  const handlePasswordChange = (e) => {
    setPasswordInput(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: null }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({ nomor_induk: null, password: null });
    setGeneralError(null);

    const trimmedId = nomorIndukInput.trim();
    let hasClientError = false;
    const clientErrors = {};

    if (!trimmedId) {
      clientErrors.nomor_induk = "Nomor Induk (NIP / NIS / ID Admin) wajib diisi.";
      hasClientError = true;
    }
    if (!passwordInput) {
      clientErrors.password = "Kata sandi wajib diisi.";
      hasClientError = true;
    }

    if (hasClientError) {
      setFieldErrors(clientErrors);
      toast.error("Mohon lengkapi formulir login.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(trimmedId, passwordInput);
      toast.success(`Selamat datang kembali, ${user.name}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const respErrors = err.response?.data?.errors;
      const respMsg = err.response?.data?.message;

      if (respErrors?.nomor_induk?.[0]) {
        const msg = respErrors.nomor_induk[0];
        setFieldErrors((prev) => ({ ...prev, nomor_induk: msg }));
        toast.error(msg);
      } else if (respErrors?.password?.[0]) {
        const msg = respErrors.password[0];
        setFieldErrors((prev) => ({ ...prev, password: msg }));
        toast.error(msg);
      } else if (respMsg) {
        setGeneralError(respMsg);
        toast.error(respMsg);
      } else {
        const fallback = "Gagal terhubung ke server backend Cendekia.";
        setGeneralError(fallback);
        toast.error(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (nomorInduk, label) => {
    setNomorIndukInput(nomorInduk);
    setPasswordInput(DEMO_PASSWORD);
    setFieldErrors({ nomor_induk: null, password: null });
    setGeneralError(null);
    toast.info(`Mengisi kredensial demo ${label}: ${nomorInduk}`);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans text-slate-800 antialiased selection:bg-brand-500 selection:text-white">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden border border-slate-200/80 grid grid-cols-1 lg:grid-cols-2">
        {/* Left Hero */}
        <div className="relative bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#1E3A8A] p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden text-white min-h-[260px] sm:min-h-[340px] lg:min-h-[580px]">
          <div className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-indigo-500/40 blur-3xl" />

          <div className="relative z-10">
            <span className="text-xs sm:text-sm font-normal text-blue-100 tracking-wide">
              Platform Belajar Digital
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mt-3">
              Tingkatkan Kualitas Belajar Bersama Cendekia
            </h2>
          </div>

          <div className="relative z-10 pt-8 mt-auto">
            <p className="text-[11px] font-medium text-blue-200 uppercase tracking-wider mb-2.5">
              Fitur Pembelajaran Terpadu
            </p>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/90">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                <FileText className="h-3 w-3" /> Model 1: PDF
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                <Volume2 className="h-3 w-3" /> Model 2: Audio
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15">
                <Video className="h-3 w-3" /> Model 3: Video
              </span>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-9 w-9 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">Cendekia</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                Selamat Datang
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Masuk menggunakan ID Administrator, NIP Guru, atau NIS Siswa
              </p>
            </div>

            {/* General Error Banner */}
            {generalError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">
                  {generalError}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Nomor Induk */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nomor Induk (NIP / NIS / ID Admin)
                  </label>
                  {fieldErrors.nomor_induk && (
                    <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Tidak Ditemukan
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 transition-colors",
                      fieldErrors.nomor_induk ? "text-red-500" : "text-slate-400"
                    )}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    value={nomorIndukInput}
                    onChange={handleNomorIndukChange}
                    placeholder="Masukkan NIP, NIS, atau ID Admin Anda"
                    className={cn(
                      "pl-10 h-11 rounded-xl font-mono text-xs sm:text-sm transition-all",
                      fieldErrors.nomor_induk
                        ? "border-red-500 bg-red-50/20 text-red-950 focus-visible:ring-red-500 focus-visible:border-red-500 ring-1 ring-red-500"
                        : "border-slate-300"
                    )}
                  />
                </div>
                {fieldErrors.nomor_induk && (
                  <p className="text-[11px] font-medium text-red-600 flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.nomor_induk}</span>
                  </p>
                )}
              </div>

              {/* Field 2: Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kata Sandi
                  </label>
                  {fieldErrors.password && (
                    <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Sandi Salah
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 transition-colors",
                      fieldErrors.password ? "text-red-500" : "text-slate-400"
                    )}
                  >
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={handlePasswordChange}
                    placeholder="Masukkan kata sandi"
                    className={cn(
                      "pl-10 pr-10 h-11 rounded-xl text-xs sm:text-sm transition-all",
                      fieldErrors.password
                        ? "border-red-500 bg-red-50/20 text-red-950 focus-visible:ring-red-500 focus-visible:border-red-500 ring-1 ring-red-500"
                        : "border-slate-300"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 z-10 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] font-medium text-red-600 flex items-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-md cursor-pointer"
              >
                {isSubmitting ? "Memverifikasi..." : "Masuk ke Dashboard"}
              </Button>
            </form>

            {/* Quick Demo Helper Buttons (hanya mode pengembangan) */}
            {SHOW_DEMO_ACCOUNTS && (
            <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-400">Akun Uji Coba:</span>
              <button
                type="button"
                onClick={() => handleFillDemo("MASTER001", "Admin Master (Cendekia)")}
                className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border border-blue-200/50"
              >
                <Crown className="h-3.5 w-3.5 text-blue-600" />
                <span>Admin Master</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("ADMIN001", "Admin Sekolah (SMA Mitra Inalum)")}
                className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border border-blue-200/50"
              >
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Admin Sekolah</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("198803122014021002", "Guru TI-A (Dr. Hendra Wijaya)")}
                className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border border-blue-200/50"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Guru (TI-A)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("199104252018032001", "Guru TI-B (Ratna Sari)")}
                className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border border-blue-200/50"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Guru (TI-B)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("20241001", "Siswa (Ahmad Fajar)")}
                className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border border-blue-200/50"
              >
                <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                <span>Siswa</span>
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
