import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, GraduationCap, HelpCircle, Lock, LogOut, Settings } from "lucide-react";
import { cn } from "../../lib/utils";
import { NAV_ITEMS, ROLE_LABELS } from "../../lib/navigation";

function SidebarLink({ to, icon: Icon, label, showLabel, onNavigate, end, locked = false }) {
  if (locked) {
    return (
      <span
        aria-disabled="true"
        title={showLabel ? "Terkunci selama ujian berlangsung" : `${label} (terkunci selama ujian)`}
        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium text-blue-200/50 cursor-not-allowed select-none"
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {showLabel && <span className="truncate flex-1">{label}</span>}
        {showLabel && <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      </span>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      title={showLabel ? undefined : label}
      className={({ isActive }) =>
        cn(
          "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all select-none group",
          isActive ? "bg-white text-brand-600 font-semibold shadow-md" : "text-blue-100 hover:bg-white/10 hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-brand-600" : "text-blue-100 group-hover:text-white")}
            aria-hidden="true"
          />
          {showLabel && <span className="truncate flex-1">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ currentUser, onLogout, isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen, locked = false }) {
  const role = currentUser?.role || "murid";
  const navItems = NAV_ITEMS[role] ?? [];
  const showLabel = !isCollapsed || mobileOpen;
  const closeMobile = () => setMobileOpen?.(false);
  const identity =
    role === "guru"
      ? `NIP: ${currentUser?.nomor_induk || "-"}`
      : role === "murid"
      ? `NIS: ${currentUser?.nomor_induk || "-"}`
      : ROLE_LABELS[role];

  return (
    <>
      {mobileOpen && (
        <div onClick={closeMobile} className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden" aria-hidden="true" />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-brand-600 text-white transition-all duration-300 ease-in-out shadow-2xl",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Navigasi utama"
      >
        {/* Brand */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md">
              <GraduationCap className="h-5 w-5 text-brand-600" aria-hidden="true" />
            </div>
            {showLabel && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-lg tracking-tight leading-tight truncate">Cendekia</span>
                <span className="text-[11px] text-blue-100 font-medium truncate" title={currentUser?.school?.name}>
                  {currentUser?.school?.name || ROLE_LABELS[role]}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-7 w-7 rounded-xl bg-white/10 hover:bg-white/20 items-center justify-center transition-colors"
            aria-label={isCollapsed ? "Buka sidebar" : "Ciutkan sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Menu utama */}
        <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <SidebarLink
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              showLabel={showLabel}
              onNavigate={closeMobile}
              locked={locked}
            />
          ))}
        </nav>

        {/* Pengaturan & bantuan */}
        <div className="px-3 py-2 border-t border-white/10 space-y-1 shrink-0">
          <SidebarLink to="/pengaturan" icon={Settings} label="Pengaturan" showLabel={showLabel} onNavigate={closeMobile} locked={locked} />
          <SidebarLink to="/bantuan" icon={HelpCircle} label="Pusat Bantuan" showLabel={showLabel} onNavigate={closeMobile} locked={locked} />
        </div>

        {/* Profil & keluar */}
        <div className="p-3 border-t border-white/10 shrink-0 space-y-2 bg-brand-700">
          <div className={cn("flex items-center gap-3 p-2 rounded-2xl", showLabel && "bg-white/10 border border-white/10", !showLabel && "justify-center")}>
            <div
              className="h-9 w-9 rounded-xl bg-white text-brand-600 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden"
              title={showLabel ? undefined : currentUser?.name}
            >
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                currentUser?.name?.charAt(0) || "U"
              )}
            </div>
            {showLabel && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{currentUser?.name}</p>
                <p className="text-[11px] text-blue-200 truncate">{identity}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={locked}
            title={locked ? "Keluar dinonaktifkan selama ujian" : showLabel ? undefined : "Keluar akun"}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-medium text-blue-100 transition-colors",
              locked ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500/20 hover:text-red-100",
              showLabel ? "justify-start" : "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 text-red-200" aria-hidden="true" />
            {showLabel && <span>Keluar Akun</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
