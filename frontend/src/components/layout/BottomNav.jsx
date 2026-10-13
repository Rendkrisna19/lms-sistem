import { NavLink } from "react-router-dom";
import { Award, BookOpen, ClipboardList, FileCheck, LayoutDashboard } from "lucide-react";
import { useExamLock } from "../../lib/examLock";
import { cn } from "../../lib/utils";

/** Tab navigasi bawah untuk siswa di layar kecil, seperti aplikasi ponsel. Terkunci selama ujian berlangsung. */
const TABS = [
  { path: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { path: "/ruang-belajar", label: "Materi", icon: BookOpen },
  { path: "/ujian", label: "Ujian", icon: Award },
  { path: "/tugas", label: "Tugas", icon: ClipboardList },
  { path: "/nilai", label: "Nilai", icon: FileCheck },
];

export function BottomNav() {
  const locked = useExamLock();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            {locked ? (
              <span aria-disabled="true" className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-300">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </span>
            ) : (
              <NavLink
                to={path}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    isActive ? "text-brand-700" : "text-slate-500 active:text-brand-600"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn("flex h-8 w-14 items-center justify-center rounded-full transition-colors", isActive && "bg-brand-100")}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className={cn(isActive && "font-semibold")}>{label}</span>
                  </>
                )}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
