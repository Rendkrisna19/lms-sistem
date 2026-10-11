import {
  Activity,
  Award,
  BarChart3,
  BookMarked,
  BookOpen,
  Building2,
  Calendar,
  FileCheck,
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
} from "lucide-react";

export const ROLES = {
  ADMIN_MASTER: "admin_master",
  ADMIN: "admin",
  TEACHER: "guru",
  STUDENT: "murid",
};

export const ROLE_LABELS = {
  admin_master: "Admin Master",
  admin: "Admin Sekolah",
  guru: "Guru",
  murid: "Siswa",
};

/** Menu sidebar per role. `path` adalah URL halaman. */
export const NAV_ITEMS = {
  admin_master: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/sekolah", label: "Data Sekolah", icon: Building2 },
    { path: "/kelas", label: "Data Kelas", icon: School },
    { path: "/guru", label: "Data Guru", icon: Users },
    { path: "/siswa", label: "Data Siswa", icon: GraduationCap },
    { path: "/mapel", label: "Mata Pelajaran", icon: BookMarked },
    { path: "/statistik", label: "Statistik Sistem", icon: BarChart3 },
  ],
  admin: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/kelas", label: "Data Kelas", icon: School },
    { path: "/guru", label: "Data Guru", icon: Users },
    { path: "/siswa", label: "Data Siswa", icon: GraduationCap },
    { path: "/mapel", label: "Mata Pelajaran", icon: BookMarked },
    { path: "/statistik", label: "Statistik Sekolah", icon: BarChart3 },
  ],
  guru: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/materi", label: "Bahan Ajar (3 Model)", icon: BookOpen },
    { path: "/ujian", label: "Ujian & Kuis", icon: Award },
    { path: "/rekap", label: "Rekap Nilai Siswa", icon: BarChart3 },
    { path: "/keaktifan", label: "Keaktifan Siswa", icon: Activity },
  ],
  murid: [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/ruang-belajar", label: "Ruang Belajar (3 Model)", icon: BookOpen },
    { path: "/ujian", label: "Ujian Online", icon: Award },
    { path: "/nilai", label: "Hasil & Nilai Saya", icon: FileCheck },
    { path: "/agenda", label: "Jadwal Pelajaran", icon: Calendar },
  ],
};

/**
 * Kompatibilitas: komponen lama memanggil onNavigateTab("materi") dsb.
 * Fungsi ini mengubah id tab lama menjadi path.
 */
export function pathForTab(tab) {
  const map = {
    dashboard: "/dashboard",
    ruang_belajar: "/ruang-belajar",
    settings: "/pengaturan",
    support: "/bantuan",
  };
  return map[tab] ?? `/${String(tab || "dashboard").replace(/_/g, "-")}`;
}
