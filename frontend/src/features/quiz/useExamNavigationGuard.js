import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Mencegah siswa meninggalkan halaman ujian: pindah rute di dalam aplikasi, tombol kembali browser,
 * dan menutup / menyegarkan tab. Mengembalikan blocker agar UI dapat menampilkan peringatan.
 */
export function useExamNavigationGuard(active) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => active && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (!active) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [active]);

  return blocker;
}
