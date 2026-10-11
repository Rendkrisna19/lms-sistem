import { useState } from "react";
import { Outlet, ScrollRestoration, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/utils";

/** Kerangka halaman setelah login: sidebar + header + konten. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.info("Anda telah keluar dari sesi Cendekia.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-800 flex">
      <Sidebar
        currentUser={user}
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={cn("flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out", isCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <Header currentUser={user} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
          <Outlet />
          <Footer />
        </main>
      </div>
      <ScrollRestoration />
    </div>
  );
}
