import React from "react";

export function Footer() {
  return (
    <footer className="pt-6 pb-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 w-full">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-700">© 2026 Cendekia Learning Hub.</span>
        <span className="hidden sm:inline text-slate-400">•</span>
        <span>Platform Pembelajaran Multimedia 3 Model (Dokumen, Audio & Video)</span>
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Semua Sistem Berjalan Normal
        </span>
        <span className="text-slate-400">Versi 2.4</span>
      </div>
    </footer>
  );
}
