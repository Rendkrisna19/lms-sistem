import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { buttonVariants } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-16 w-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Halaman yang Anda tuju tidak tersedia atau Anda tidak memiliki akses ke halaman ini.
      </p>
      <Link to="/dashboard" className={buttonVariants({ className: "mt-6" })}>
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
