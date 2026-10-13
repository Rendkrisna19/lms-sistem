import { useState } from "react";
import { Outlet, ScrollRestoration, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { useAuth } from "../../lib/auth";
import { useExamLock } from "../../lib/examLock";
import { cn } from "../../lib/utils";

/** Kerangka halaman setelah login: sidebar + header + konten. Navigasi dikunci selama ujian berlangsung. */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const locked = useExamLock();
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
        locked={locked}
      />

      <div className={cn("flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out", isCollapsed ? "lg:pl-20" : "lg:pl-64")}>
        <Header currentUser={user} onOpenMobileMenu={() => setMobileOpen(true)} locked={locked} />
        <main className={cn("flex-1 w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6", user?.role === "murid" && "pb-24 lg:pb-8")}>
          <Outlet />
          <Footer />
        </main>
      </div>
      {user?.role === "murid" && <BottomNav />}
      <ScrollRestoration />
    </div>
  );
}
