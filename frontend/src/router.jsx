import { createBrowserRouter, Navigate, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { GuestOnly, RequireAuth, RequireRole } from "./components/routing/RouteGuards";
import { useAuth } from "./lib/auth";
import { pathForTab, ROLES } from "./lib/navigation";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SchoolsPage } from "./pages/SchoolsPage";
import { ClassroomsPage } from "./pages/ClassroomsPage";
import { TeachersPage } from "./pages/TeachersPage";
import { StudentsPage } from "./pages/StudentsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { GradesPage } from "./pages/GradesPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudentGradesPage } from "./pages/student/StudentGradesPage";
import { StudentSchedulePage } from "./pages/student/StudentSchedulePage";
import { TeacherQuizListPage } from "./pages/quiz/TeacherQuizListPage";
import { QuizEditorPage } from "./pages/quiz/QuizEditorPage";
import { QuizDetailPage } from "./pages/quiz/QuizDetailPage";
import { StudentQuizListPage } from "./pages/quiz/StudentQuizListPage";
import { ExamRoomPage } from "./pages/quiz/ExamRoomPage";

const { ADMIN_MASTER, ADMIN, TEACHER, STUDENT } = ROLES;

/** Memberikan `currentUser` ke halaman lama yang masih menerima prop tersebut. */
function WithUser({ component: Component }) {
  const { user } = useAuth();
  return <Component currentUser={user} />;
}

function DashboardRoute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <DashboardPage
      role={user.role}
      currentUser={user}
      onNavigateTab={(tab) => navigate(pathForTab(tab))}
      onExportCSV={() => navigate(user.role === TEACHER ? "/rekap" : "/nilai")}
    />
  );
}

function SettingsRoute() {
  const { user, updateUser } = useAuth();
  return <SettingsPage currentUser={user} onUpdateCurrentUser={updateUser} />;
}

function QuizIndexRoute() {
  const { role } = useAuth();
  return role === TEACHER ? <TeacherQuizListPage /> : <StudentQuizListPage />;
}

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <DashboardRoute /> },
          { path: "pengaturan", element: <SettingsRoute /> },
          { path: "bantuan", element: <HelpPage /> },

          // Admin master
          {
            element: <RequireRole roles={[ADMIN_MASTER]} />,
            children: [{ path: "sekolah", element: <WithUser component={SchoolsPage} /> }],
          },

          // Admin sekolah & admin master
          {
            element: <RequireRole roles={[ADMIN, ADMIN_MASTER]} />,
            children: [
              { path: "kelas", element: <WithUser component={ClassroomsPage} /> },
              { path: "guru", element: <WithUser component={TeachersPage} /> },
              { path: "siswa", element: <WithUser component={StudentsPage} /> },
              { path: "mapel", element: <WithUser component={CoursesPage} /> },
              { path: "statistik", element: <WithUser component={StatsPage} /> },
            ],
          },

          // Guru
          {
            element: <RequireRole roles={[TEACHER]} />,
            children: [
              { path: "materi", element: <WithUser component={MaterialsPage} /> },
              { path: "ujian/baru", element: <QuizEditorPage /> },
              { path: "ujian/:quizId/edit", element: <QuizEditorPage /> },
              { path: "ujian/:quizId", element: <QuizDetailPage /> },
              { path: "rekap", element: <WithUser component={GradesPage} /> },
              { path: "keaktifan", element: <WithUser component={StatsPage} /> },
            ],
          },

          // Siswa
          {
            element: <RequireRole roles={[STUDENT]} />,
            children: [
              { path: "ruang-belajar", element: <WithUser component={MaterialsPage} /> },
              { path: "ujian/:quizId/kerjakan", element: <ExamRoomPage /> },
              { path: "nilai", element: <StudentGradesPage /> },
              { path: "agenda", element: <StudentSchedulePage /> },
            ],
          },

          // Guru & siswa
          {
            element: <RequireRole roles={[TEACHER, STUDENT]} />,
            children: [{ path: "ujian", element: <QuizIndexRoute /> }],
          },

          // URL lama
          { path: "data-sekolah", element: <Navigate to="/sekolah" replace /> },
          { path: "data-kelas", element: <Navigate to="/kelas" replace /> },
          { path: "data-guru", element: <Navigate to="/guru" replace /> },
          { path: "data-siswa", element: <Navigate to="/siswa" replace /> },
          { path: "mata-pelajaran", element: <Navigate to="/mapel" replace /> },
          { path: "statistik-sistem", element: <Navigate to="/statistik" replace /> },
          { path: "settings", element: <Navigate to="/pengaturan" replace /> },
          { path: "support", element: <Navigate to="/bantuan" replace /> },

          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
