import { AdminMasterDashboard } from "../components/dashboard/AdminMasterDashboard";
import { SchoolAdminDashboard } from "../components/dashboard/SchoolAdminDashboard";
import { TeacherDashboard } from "../components/dashboard/TeacherDashboard";
import { StudentDashboard } from "../components/dashboard/StudentDashboard";

/** Memilih dashboard sesuai role. Tiap dashboard mengambil datanya sendiri. */
export function DashboardPage({ role = "murid", currentUser, onExportCSV, onNavigateTab }) {
  if (role === "admin_master") {
    return <AdminMasterDashboard currentUser={currentUser} onNavigateTab={onNavigateTab} />;
  }

  if (role === "admin") {
    return <SchoolAdminDashboard currentUser={currentUser} onNavigateTab={onNavigateTab} />;
  }

  if (role === "guru") {
    return <TeacherDashboard currentUser={currentUser} onExportCSV={onExportCSV} onNavigateTab={onNavigateTab} />;
  }

  // Default: Siswa / Murid
  return <StudentDashboard currentUser={currentUser} onNavigateTab={onNavigateTab} onExportCSV={onExportCSV} />;
}
