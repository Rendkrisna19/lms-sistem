export function Footer() {
  return (
    <footer className="mt-auto pt-6 pb-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 w-full">
      <span className="font-semibold text-slate-700">© {new Date().getFullYear()} Cendekia Learning Hub</span>
      <span>Platform Pembelajaran Multimedia & Evaluasi Digital</span>
    </footer>
  );
}
