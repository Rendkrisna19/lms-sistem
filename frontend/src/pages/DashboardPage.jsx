import React from "react";
import { AdminMasterDashboard } from "../components/dashboard/AdminMasterDashboard";
import { SchoolAdminDashboard } from "../components/dashboard/SchoolAdminDashboard";
import { TeacherDashboard } from "../components/dashboard/TeacherDashboard";
import { StudentDashboard } from "../components/dashboard/StudentDashboard";

export function DashboardPage({
  role = "murid",
  currentUser,
  overview,
  students,
  onExportCSV,
  onNavigateTab,
  onDataUpdated
}) {
  if (role === "admin_master") {
    return (
      <AdminMasterDashboard
        currentUser={currentUser}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  if (role === "admin") {
    return (
      <SchoolAdminDashboard
        currentUser={currentUser}
        overview={overview}
        onNavigateTab={onNavigateTab}
        onDataUpdated={onDataUpdated}
      />
    );
  }

  if (role === "guru") {
    return (
      <TeacherDashboard
        currentUser={currentUser}
        onExportCSV={onExportCSV}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // Default: Siswa / Murid
  return (
    <StudentDashboard
      currentUser={currentUser}
      onNavigateTab={onNavigateTab}
      onExportCSV={onExportCSV}
    />
  );
}
