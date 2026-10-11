import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  FileText,
  Volume2,
  Video,
  CheckCircle2,
  Users,
  BookMarked,
  Settings,
  HelpCircle,
  Activity,
  Calendar,
  FileCheck,
  ShieldCheck,
  Crown,
  School,
  Building2
} from "lucide-react";
import { cn } from "../../lib/utils";

export function Sidebar({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const role = currentUser?.role || "murid";

  // Navigation items per role with Multi-Tenant & Admin Master Support
  const getNavItems = () => {
    if (role === "admin_master") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "sekolah", label: "Data Sekolah", icon: Building2 },
        { id: "kelas", label: "Data Kelas", icon: School },
        { id: "guru", label: "Data Guru", icon: Users },
        { id: "siswa", label: "Data Siswa", icon: GraduationCap },
        { id: "mapel", label: "Mata Pelajaran", icon: BookMarked },
        { id: "statistik", label: "Statistik Sistem", icon: BarChart3 },
      ];
    }

    if (role === "admin") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "kelas", label: "Data Kelas", icon: School },
        { id: "guru", label: "Data Guru", icon: Users },
        { id: "siswa", label: "Data Siswa", icon: GraduationCap },
        { id: "mapel", label: "Mata Pelajaran", icon: BookMarked },
        { id: "statistik", label: "Statistik Sistem", icon: BarChart3 },
      ];
    }

    if (role === "guru") {
      return [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "materi", label: "Bahan Ajar (3 Model)", icon: BookOpen },
        { id: "ujian", label: "Ujian & Kuis", icon: Award },
        { id: "rekap", label: "Rekap Nilai Siswa", icon: BarChart3 },
        { id: "keaktifan", label: "Keaktifan Siswa", icon: Activity },
      ];
    }

    // Default: Siswa / Murid
    return [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "ruang_belajar", label: "Ruang Belajar (3 Model)", icon: BookOpen },
      { id: "ujian", label: "Ujian Online", icon: Award },
      { id: "nilai", label: "Hasil & Nilai Saya", icon: FileCheck },
      { id: "agenda", label: "Jadwal & Agenda", icon: Calendar },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Modern Royal Blue Sidebar (Medlio Style) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#2563EB] text-white transition-all duration-300 ease-in-out shadow-2xl",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-white text-brand-600 flex items-center justify-center shrink-0 shadow-md">
              <GraduationCap className="h-5 w-5 text-brand-600" />
            </div>

            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-lg tracking-tight text-white leading-tight truncate">
                  Cendekia
                </span>
                <div className="flex items-center gap-1 text-[11px] text-blue-100 font-medium truncate">
                  <span
                    className="truncate max-w-[110px] font-semibold text-white/95"
                    title={currentUser?.school?.name || "SMA Mitra Inalum"}
                  >
                    {currentUser?.school?.name || "SMA Mitra Inalum"}
                  </span>
                  <span className="text-blue-300">•</span>
                  <span className="truncate">
                    {role === "admin_master"
                      ? "Admin Master"
                      : role === "admin"
                      ? "Admin"
                      : role === "guru"
                      ? "Guru"
                      : "Siswa"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 rounded-xl bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors cursor-pointer"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation List (Clean Single-Level Medlio Style) */}
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-medium text-xs sm:text-sm transition-all select-none cursor-pointer group text-left",
                  isActive
                    ? "bg-white text-brand-600 font-bold shadow-md"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-brand-600" : "text-blue-100 group-hover:text-white"
                  )}
                />

                {(!isCollapsed || mobileOpen) && (
                  <span className="truncate flex-1 text-xs sm:text-sm">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Settings & Support */}
        <div className="px-3 py-2 border-t border-white/10 space-y-1 shrink-0">
          <button
            onClick={() => setActiveTab("settings")}
            title={isCollapsed ? "Pengaturan" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left",
              activeTab === "settings" ? "bg-white text-brand-600 font-bold shadow-md" : ""
            )}
          >
            <Settings className={cn("h-4 w-4 shrink-0", activeTab === "settings" ? "text-brand-600" : "text-blue-100")} />
            {(!isCollapsed || mobileOpen) && <span>Pengaturan</span>}
          </button>

          <button
            onClick={() => setActiveTab("support")}
            title={isCollapsed ? "Pusat Bantuan" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-left",
              activeTab === "support" ? "bg-white text-brand-600 font-bold shadow-md" : ""
            )}
          >
            <HelpCircle className={cn("h-4 w-4 shrink-0", activeTab === "support" ? "text-brand-600" : "text-blue-100")} />
            {(!isCollapsed || mobileOpen) && <span>Pusat Bantuan</span>}
          </button>
        </div>

        {/* User Mini Profile & Logout in Sidebar Footer */}
        <div className="p-3 border-t border-white/10 shrink-0 space-y-2 bg-[#1D4ED8]">
          {(!isCollapsed || mobileOpen) ? (
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/10 border border-white/10">
              <div className="h-9 w-9 rounded-xl bg-white text-brand-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  currentUser?.name ? currentUser.name.charAt(0) : "U"
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-blue-200 truncate">
                  {role === "admin_master" ? "Admin Master" : role === "admin" ? "Admin Sekolah" : role === "guru" ? `NIP: ${currentUser?.nomor_induk || currentUser?.nim_nip || '-'}` : `NIS: ${currentUser?.nomor_induk || currentUser?.nim_nip || '-'}`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div
                className="h-9 w-9 rounded-xl bg-white text-brand-600 flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden"
                title={`${currentUser?.name} (${role})`}
              >
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="h-full w-full object-cover" />
                ) : (
                  currentUser?.name ? currentUser.name.charAt(0) : "U"
                )}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title={isCollapsed ? "Keluar Akun" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer",
              isCollapsed && !mobileOpen ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-300" />
            {(!isCollapsed || mobileOpen) && <span>Keluar Akun</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
