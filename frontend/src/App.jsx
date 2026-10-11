import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TeachersPage } from "./pages/TeachersPage";
import { StudentsPage } from "./pages/StudentsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { QuizPage } from "./pages/QuizPage";
import { GradesPage } from "./pages/GradesPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ClassroomsPage } from "./pages/ClassroomsPage";
import { SchoolsPage } from "./pages/SchoolsPage";
import { api } from "./lib/api";
import { cn } from "./lib/utils";

import { useLocation, useNavigate } from "react-router-dom";

// 7 Days Persistent Session Constants (in milliseconds)
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Authenticated Session with 7-Day Validity Check
  const [authToken, setAuthToken] = useState(() => {
    const token = localStorage.getItem("lms_token");
    const loginTime = localStorage.getItem("lms_login_time");
    if (token && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed > SEVEN_DAYS_MS) {
        localStorage.removeItem("lms_token");
        localStorage.removeItem("lms_user");
        localStorage.removeItem("lms_login_time");
        return null;
      }
      return token;
    }
    return token || null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("lms_user");
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Navigation with Clean React Router URLs (No Hash)
  const getTabFromPath = (pathname) => {
    const raw = pathname.replace(/^\//, "").split("/")[0].trim().toLowerCase();
    if (!raw || raw === "dashboard") return "dashboard";
    if (raw === "ruang-belajar") return "ruang_belajar";
    if (raw === "data-kelas" || raw === "kelas") return "kelas";
    if (raw === "data-sekolah" || raw === "sekolah") return "sekolah";
    if (raw === "data-guru" || raw === "guru") return "guru";
    if (raw === "data-siswa" || raw === "siswa") return "siswa";
    if (raw === "mata-pelajaran" || raw === "mapel") return "mapel";
    if (raw === "statistik-sistem" || raw === "statistik") return "statistik";
    return raw;
  };

  const activeTab = getTabFromPath(location.pathname);

  const handleSelectTab = (tab) => {
    const route = tab === "ruang_belajar" ? "ruang-belajar" : tab;
    navigate("/" + (route === "dashboard" ? "dashboard" : route));
  };

  // Clean any legacy hash URLs (e.g. /#sekolah -> /sekolah)
  useEffect(() => {
    if (window.location.hash) {
      const cleanHash = window.location.hash.replace("#", "").trim();
      if (cleanHash) {
        window.history.replaceState(null, "", "/" + cleanHash);
        navigate("/" + cleanHash, { replace: true });
      }
    }
  }, [navigate]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 3. Backend Real Overview Statistics State
  const [backendOverview, setBackendOverview] = useState(null);

  // Fetch real statistics from Laravel if authenticated
  const fetchOverview = () => {
    if (authToken) {
      api.get("/admin/overview")
        .then((res) => {
          if (res.data?.status === "success") {
            setBackendOverview(res.data.data);
          }
        })
        .catch((err) => {
          console.warn("Could not load /admin/overview from Laravel:", err);
        });
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [authToken]);

  // Handle Login Completion
  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    handleSelectTab("dashboard");
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      if (authToken) {
        await api.post("/logout").catch(() => {});
      }
    } catch (e) {
      // ignore
    } finally {
      setAuthToken(null);
      setCurrentUser(null);
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_user");
      localStorage.removeItem("lms_login_time");
      toast.info("Anda telah keluar dari sesi Cendekia.");
    }
  };

  // Quick Role Switcher (from top header or query parameter)
  const handleSwitchRole = (newRole, fromUrl = false) => {
    let updatedUser;
    if (newRole === "admin_master") {
      updatedUser = {
        id: 98,
        name: "Super Administrator (Master)",
        nomor_induk: "MASTER001",
        email: "master@cendekia.ac.id",
        role: "admin_master",
        school: null,
      };
      toast.success("Beralih ke mode Admin Master (Multi-Sekolah)");
    } else if (newRole === "admin") {
      updatedUser = {
        id: 99,
        name: "Admin SMA Mitra Inalum",
        nomor_induk: "ADMIN001",
        email: "admin.master@cendekia.ac.id",
        role: "admin",
        school_id: 1,
        school: { id: 1, name: "SMA Mitra Inalum", npsn: "10203040" },
      };
      toast.success("Beralih ke mode Admin Sekolah (SMA Mitra Inalum)");
    } else if (newRole === "guru") {
      updatedUser = {
        id: 13,
        name: "Dr. Hendra Wijaya, M.T.",
        nomor_induk: "198803122014021002",
        email: "hendra@cendekia.ac.id",
        role: "guru",
        school_id: 1,
        school: { id: 1, name: "SMA Mitra Inalum", npsn: "10203040" },
      };
      toast.success("Beralih ke mode Guru: Dr. Hendra Wijaya, M.T. (Basis Data • TI-A)");
    } else if (newRole === "guru_ratna") {
      updatedUser = {
        id: 14,
        name: "Ratna Sari, M.Cs.",
        nomor_induk: "199104252018032001",
        email: "ratna@cendekia.ac.id",
        role: "guru",
        school_id: 1,
        school: { id: 1, name: "SMA Mitra Inalum", npsn: "10203040" },
      };
      toast.success("Beralih ke mode Guru: Ratna Sari, M.Cs. (RPL • TI-B)");
    } else {
      updatedUser = {
        id: 15,
        name: "Siswa Belajar (Ahmad Fajar)",
        nomor_induk: "20241001",
        email: "siswa@gmail.com",
        role: "murid",
        school_id: 1,
        classroom_id: 1,
        school: { id: 1, name: "SMA Mitra Inalum", npsn: "10203040" },
      };
      toast.success("Beralih ke mode Siswa: Ahmad Fajar (TI-A)");
    }
    setCurrentUser(updatedUser);
    localStorage.setItem("lms_user", JSON.stringify(updatedUser));

    if (!fromUrl) {
      const targetTab = newRole === "admin_master" ? "sekolah" : "dashboard";
      navigate(`/${targetTab}?role=${newRole}`);
    }
  };

  // URL Query Param Role Listener (e.g. ?role=guru or ?role=guru_ratna)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get("role");
    if (roleParam) {
      if ((roleParam === "guru" || roleParam === "teacher_tia") && currentUser?.id !== 13) {
        handleSwitchRole("guru", true);
      } else if ((roleParam === "guru_ratna" || roleParam === "teacher_tib") && currentUser?.id !== 14) {
        handleSwitchRole("guru_ratna", true);
      } else if (roleParam === "admin" && currentUser?.role !== "admin") {
        handleSwitchRole("admin", true);
      } else if (roleParam === "admin_master" && currentUser?.role !== "admin_master") {
        handleSwitchRole("admin_master", true);
      } else if ((roleParam === "murid" || roleParam === "siswa") && currentUser?.role !== "murid") {
        handleSwitchRole("murid", true);
      }
    }
  }, [location.search]);

  // CSV Export Handler
  const handleExportCSV = () => {
    toast.success("Mengunduh rekapitulasi nilai format .CSV...");
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "NO,NIS,NAMA SISWA,KELAS,NILAI,STATUS,WAKTU SUBMIT\n" +
      "1,20241001,\"Siswa Belajar (Ahmad Fajar)\",\"Teknik Informatika - A\",100,Lulus,\"13:30, 10 Okt 2026\"\n" +
      "2,20241002,\"Siti Aisyah\",\"Teknik Informatika - A\",90,Lulus,\"14:40, 10 Okt 2026\"\n" +
      "3,20241003,\"Budi Pratama\",\"Teknik Informatika - B\",65,Remedial,\"14:40, 10 Okt 2026\"\n" +
      "4,20241004,\"Dewi Lestari\",\"Teknik Informatika - B\",85,Lulus,\"14:40, 10 Okt 2026\"\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rekap_nilai_cendekia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If not authenticated, render Login Page
  if (!authToken || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const role = currentUser.role || "murid";

  return (
    <div className="min-h-screen w-full bg-[#F4F6FA] text-slate-800 flex antialiased font-sans">
      <Toaster position="top-right" richColors />

      {/* 1. Medlio Royal Blue Single-Level Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* 2. Main Workspace (Flush directly to sidebar with smooth transition) */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <Header
          currentUser={currentUser}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSwitchRole={handleSwitchRole}
        />

        {/* 3. Main Modular Route View (Flush attached to sidebar) */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === "dashboard" && (
            <DashboardPage
              role={role}
              currentUser={currentUser}
              overview={backendOverview}
              onExportCSV={handleExportCSV}
              onNavigateTab={handleSelectTab}
              onDataUpdated={fetchOverview}
            />
          )}

          {activeTab === "sekolah" && (
            <SchoolsPage currentUser={currentUser} />
          )}

          {activeTab === "kelas" && (
            <ClassroomsPage currentUser={currentUser} />
          )}

          {activeTab === "guru" && (
            <TeachersPage currentUser={currentUser} />
          )}

          {activeTab === "siswa" && (
            <StudentsPage currentUser={currentUser} />
          )}

          {(activeTab === "mapel" || activeTab === "agenda") && (
            <CoursesPage currentUser={currentUser} />
          )}

          {(activeTab === "materi" || activeTab === "ruang_belajar") && (
            <MaterialsPage currentUser={currentUser} />
          )}

          {activeTab === "ujian" && (
            <QuizPage
              currentUser={currentUser}
              onReturnToDashboard={() => handleSelectTab("dashboard")}
            />
          )}

          {(activeTab === "rekap" || activeTab === "nilai") && (
            <GradesPage currentUser={currentUser} />
          )}

          {(activeTab === "statistik" || activeTab === "keaktifan") && (
            <StatsPage currentUser={currentUser} />
          )}

          {(activeTab === "pengaturan" || activeTab === "settings" || activeTab === "support") && (
            <SettingsPage
              currentUser={currentUser}
              onUpdateCurrentUser={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem("lms_user", JSON.stringify(updated));
              }}
            />
          )}

          {/* 4. Professional Modern Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
