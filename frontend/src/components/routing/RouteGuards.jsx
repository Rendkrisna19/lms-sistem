import { Navigate, Outlet, useLocation } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { NotFoundPage } from "../../pages/NotFoundPage";

export function FullScreenLoader({ label = "Memuat sesi Anda..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas text-slate-500" role="status">
      <div className="h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30">
        <GraduationCap className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

/** Halaman hanya untuk pengguna yang sudah login. */
export function RequireAuth() {
  const { isAuthenticated, isVerifying, user } = useAuth();
  const location = useLocation();

  if (isVerifying && !user) return <FullScreenLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Halaman hanya untuk role tertentu. Role lain melihat halaman 404 (tidak membocorkan keberadaan fitur). */
export function RequireRole({ roles }) {
  const { role } = useAuth();
  if (!roles.includes(role)) return <NotFoundPage />;
  return <Outlet />;
}

/** Halaman login hanya untuk tamu. */
export function GuestOnly() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }
  return <Outlet />;
}
