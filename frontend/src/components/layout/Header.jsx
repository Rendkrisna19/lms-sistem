import { Building2, Calendar, Menu } from "lucide-react";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ROLE_LABELS } from "../../lib/navigation";

export function Header({ currentUser, onOpenMobileMenu }) {
  const role = currentUser?.role || "murid";
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-10 w-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 min-w-0">
          <Calendar className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />
          <span className="truncate">{today}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {currentUser?.school?.name && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50/80 border border-brand-200/60 text-xs text-brand-700 font-semibold">
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[180px]">{currentUser.school.name}</span>
          </div>
        )}

        <Badge variant="secondary" className="px-3 py-1 font-semibold">
          {ROLE_LABELS[role]}
        </Badge>

        <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
          <Avatar className="h-10 w-10 ring-2 ring-brand-100">
            {currentUser?.avatar && <AvatarImage src={currentUser.avatar} alt={currentUser.name} />}
            <AvatarFallback className="bg-brand-600 text-white font-bold text-xs">{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="hidden xl:block text-left text-xs">
            <p className="font-bold text-slate-900 leading-tight truncate max-w-[160px]">{currentUser?.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">{currentUser?.nomor_induk}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
