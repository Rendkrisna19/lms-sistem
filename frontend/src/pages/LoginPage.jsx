import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Building2, Crown, Eye, EyeOff, GraduationCap, Lock, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { AuthHeroArt } from "../components/auth/AuthHeroArt";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

// Tombol isi-otomatis akun demo hanya untuk pengembangan lokal (VITE_SHOW_DEMO_ACCOUNTS=true)
const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || "";

const DEMO_ACCOUNTS = [
  { id: "MASTER001", label: "Admin Master", icon: Crown },
  { id: "ADMIN002", label: "Admin Sekolah", icon: Building2 },
  { id: "198803122014021002", label: "Guru", icon: ShieldCheck },
  { id: "20241001", label: "Siswa", icon: GraduationCap },
];

/** Field isian dengan ikon kiri, aksen biru di sisi kiri, dan pesan error di bawah. */
function AuthField({ label, icon: Icon, error, trailing, children, id }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600">
        {label}
      </label>
      <div
        className={cn(
          "group relative flex h-12 items-center overflow-hidden rounded-xl border bg-white transition-all",
          error ? "border-red-400 ring-4 ring-red-500/10" : "border-slate-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10 hover:border-slate-300"
        )}
      >
        <span className={cn("absolute inset-y-2 left-0 w-1 rounded-r-full transition-colors", error ? "bg-red-500" : "bg-brand-500/0 group-focus-within:bg-brand-500")} aria-hidden="true" />
        <span className={cn("flex h-full w-11 shrink-0 items-center justify-center transition-colors", error ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-600")}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {children}
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      clientErrors.nomor_induk = "Nomor induk (NIP, NIS, atau ID admin) wajib diisi.";
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-blue-50 p-4 font-sans text-slate-800 antialiased sm:p-8">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-blue-900/15 ring-1 ring-slate-900/5 lg:grid-cols-[1.05fr_1fr]">
        {/* Panel kiri: biru dengan ilustrasi geometris */}
        <aside className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2F6BFF] via-[#2563EB] to-[#1D4ED8] p-8 text-white sm:p-10 lg:min-h-[640px] lg:p-12">
          <AuthHeroArt />

          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg shadow-blue-950/20">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Cendekia</span>
          </div>

          <div className="relative z-10 mt-12 space-y-5 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/90">Platform belajar digital</p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Halo,
              <br />
              selamat datang!
            </h1>
            <p className="max-w-xs text-sm leading-relaxed text-blue-100/90">
              Materi dalam tiga model belajar, ujian online, dan penugasan, semua dalam satu tempat untuk guru, siswa, dan sekolah.
            </p>
          </div>

          <div className="relative z-10 mt-10 flex flex-wrap gap-2 text-xs font-medium lg:mt-0">
            {["Dokumen PDF", "Audio", "Video"].map((item) => (
              <span key={item} className="rounded-full bg-white/12 px-3 py-1 ring-1 ring-white/20 backdrop-blur-sm">
                {item}
              </span>
            ))}
          </div>
        </aside>

        {/* Panel kanan: formulir */}
        <main className="flex flex-col justify-center bg-white p-8 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-8 space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Masuk ke akun Anda</h2>
              <p className="text-sm text-slate-500">Gunakan ID admin, NIP guru, atau NIS siswa.</p>
            </div>

            {generalError && (
              <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium leading-relaxed text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <AuthField id="login-id" label="Nomor induk" icon={User} error={fieldErrors.nomor_induk}>
                <input
                  id="login-id"
                  type="text"
                  autoComplete="username"
                  value={nomorIndukInput}
                  onChange={handleNomorIndukChange}
                  placeholder="NIP, NIS, atau ID admin"
                  aria-invalid={Boolean(fieldErrors.nomor_induk) || undefined}
                  aria-describedby={fieldErrors.nomor_induk ? "login-id-error" : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent pr-4 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none"
                />
              </AuthField>

              <AuthField
                id="login-password"
                label="Kata sandi"
                icon={Lock}
                error={fieldErrors.password}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                }
              >
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={passwordInput}
                  onChange={handlePasswordChange}
                  placeholder="Masukkan kata sandi"
                  aria-invalid={Boolean(fieldErrors.password) || undefined}
                  aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                  className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </AuthField>

              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-brand-600 to-blue-700 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 hover:from-brand-700 hover:to-blue-800"
              >
                {isSubmitting ? "Memverifikasi…" : "Masuk"}
              </Button>
            </form>

            {SHOW_DEMO_ACCOUNTS && (
              <div className="mt-10 border-t border-slate-100 pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Akun uji coba</p>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleFillDemo(id, label)}
                      className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100"
                    >
                      <Icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
