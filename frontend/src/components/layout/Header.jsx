import React from "react";
import {
  Menu,
  Search,
  Bell,
  Calendar,
  ShieldCheck,
  UserCheck,
  Crown,
  Building2,
  School
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export function Header({
  currentUser,
  onOpenMobileMenu,
  searchQuery,
  setSearchQuery,
  onSwitchRole,
}) {
  const role = currentUser?.role || "murid";

  const getRoleBadge = () => {
    if (role === "admin_master") {
      return (
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 font-semibold">
          <Crown className="h-3.5 w-3.5 text-blue-600" />
          <span>Admin Master</span>
        </Badge>
      );
    }
    if (role === "admin") {
      return (
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 font-semibold">
          <Building2 className="h-3.5 w-3.5 text-blue-600" />
          <span>Admin Sekolah</span>
        </Badge>
      );
    }
    if (role === "guru") {
      return (
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
          <span>Guru</span>
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200 font-semibold">
        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
        <span>Siswa</span>
      </Badge>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all w-full">
      {/* Left: Mobile Trigger + Pill Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-10 w-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          aria-label="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari materi, kuis, data akademik..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-full bg-slate-100/90 border-transparent placeholder:text-slate-400 text-slate-800 focus-visible:ring-blue-500 focus-visible:bg-white focus-visible:border-slate-200 transition-all font-medium h-10"
          />
        </div>
      </div>

      {/* Right: Quick Role Switcher, School Tenant Badge, Date, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Role Switcher (Pure Blue active buttons) */}
        {onSwitchRole && (
          <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/60 text-xs">
            <button
              id="btn-switch-master"
              type="button"
              onClick={() => onSwitchRole("admin_master")}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                role === "admin_master"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Master
            </button>
            <button
              id="btn-switch-admin"
              type="button"
              onClick={() => onSwitchRole("admin")}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                role === "admin"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Admin
            </button>
            <button
              id="btn-switch-guru-tia"
              type="button"
              onClick={() => onSwitchRole("guru")}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                role === "guru" && currentUser?.id !== 14
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Guru TI-A: Dr. Hendra Wijaya, M.T. (Basis Data Relasional)"
            >
              Guru (TI-A)
            </button>
            <button
              id="btn-switch-guru-tib"
              type="button"
              onClick={() => onSwitchRole("guru_ratna")}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                role === "guru" && currentUser?.id === 14
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Guru TI-B: Ratna Sari, M.Cs. (Rekayasa Perangkat Lunak)"
            >
              Guru (TI-B)
            </button>
            <button
              id="btn-switch-murid"
              type="button"
              onClick={() => onSwitchRole("murid")}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                role === "murid"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Siswa
            </button>
          </div>
        )}

        {/* School Tenant Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-xs text-blue-700 font-semibold">
          <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span className="truncate max-w-[160px]">
            {currentUser?.school?.name || (role === "admin_master" ? "Pusat Cendekia" : "SMA Mitra Inalum")}
          </span>
        </div>

        {getRoleBadge()}

        <button
          className="relative h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          title="Notifikasi Sistem"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white animate-pulse" />
        </button>

        {/* User Mini Avatar Profile Pill with shadcn Avatar */}
        <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
          <Avatar className="h-10 w-10 ring-2 ring-brand-100 shadow-xs">
            {currentUser?.avatar && (
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            )}
            <AvatarFallback className="bg-brand-600 text-white font-bold text-xs">
              {currentUser?.name ? currentUser.name.charAt(0) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden xl:block text-left text-xs">
            <p className="font-bold text-slate-900 leading-tight truncate max-w-[130px]">
              {currentUser?.name}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {currentUser?.nomor_induk || currentUser?.nim_nip}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
