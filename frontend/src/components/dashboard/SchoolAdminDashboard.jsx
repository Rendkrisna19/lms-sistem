import { useEffect } from "react";
import { Users, GraduationCap, School, BookMarked, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AdminMasterDataSection } from "./AdminMasterDataSection";
import { BarChartCard } from "./BarChartCard";
import { MediaPreferenceCard } from "./MediaPreferenceCard";
import { useApiQuery } from "../../hooks/useApiQuery";
import { SchoolIdentityCard } from "../school/SchoolIdentityCard";
import { useAdminResource } from "../../features/admin/useAdminResource";
import { countLabel } from "../../features/admin/format";

/** Dashboard admin sekolah: ringkasan sekolahnya sendiri (server membatasi data ke sekolah akun ini). */
export function SchoolAdminDashboard({ currentUser, onNavigateTab }) {
  const overview = useApiQuery("/school-admin/overview");
  const analytics = useApiQuery("/admin/learning-analytics");
  const classrooms = useAdminResource("classrooms");

  useEffect(() => {
    if (overview.error) toast.error("Gagal memuat ringkasan sekolah.");
  }, [overview.error]);

  const data = overview.data;
  const isLoading = overview.isLoading;
  const schoolName = currentUser?.school?.name || data?.school?.name || "–";
  const classBars = classrooms.rows.map((c) => ({
    key: c.id,
    label: c.code,
    fullLabel: c.name,
    value: c.students_count ?? 0,
  }));

  return (
    <div className="space-y-6 w-full">
      <SchoolIdentityCard
        eyebrow={`Admin Sekolah Portal • ${schoolName}`}
        title={`Dashboard Akademik ${schoolName}`}
        description="Manajemen operasional kurikulum, plotting rombel kelas, data pendidik, dan pemantauan peserta didik sekolah."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => onNavigateTab("kelas")} className="rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs h-10 px-4 shadow-md cursor-pointer">
              <School className="h-4 w-4 mr-2" />
              Plotting Rombel Kelas
            </Button>
            <Button onClick={overview.reload} variant="outline" className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3 cursor-pointer" title="Muat Ulang Data">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => onNavigateTab("guru")}
          className="bg-blue-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-600/15 border-none flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">Guru Pengampu</span>
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-colors">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : countLabel(data?.total_teachers, "Guru")}
            </h3>
            <p className="text-xs text-blue-100 mt-1 font-medium">Terdaftar di {schoolName} →</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("siswa")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Siswa Terdaftar</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : countLabel(data?.total_students, "Siswa")}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">Peserta Didik Aktif →</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("kelas")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rombel Kelas</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <School className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : countLabel(data?.total_classrooms, "Rombel")}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">Kelola Kelas & Plotting →</p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("mapel")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mata Pelajaran</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookMarked className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : countLabel(data?.total_courses, "Mapel")}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">Kurikulum Berjalan →</p>
          </div>
        </Card>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        <div className="lg:col-span-7">
          <BarChartCard
            title="Jumlah Siswa per Kelas"
            items={classBars}
            isLoading={classrooms.isLoading}
            emptyText="Belum ada rombel kelas terdaftar."
          />
        </div>
        <div className="lg:col-span-5">
          <MediaPreferenceCard summary={analytics.data?.summary} />
        </div>
      </div>

      {/* Row 3: Admin Master Data Management (Guru, Siswa, Mapel) */}
      <AdminMasterDataSection onDataUpdated={overview.reload} onNavigateTab={onNavigateTab} />
    </div>
  );
}
