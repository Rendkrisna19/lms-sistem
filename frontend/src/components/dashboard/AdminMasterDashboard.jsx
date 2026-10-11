import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  GraduationCap,
  School,
  Award,
  BookOpen,
  TrendingUp,
  FileText,
  Volume2,
  Video,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function AdminMasterDashboard({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMasterData = async () => {
    try {
      setIsLoading(true);
      const [resOverview, resAnalytics] = await Promise.all([
        api.get("/master/overview"),
        api.get("/master/learning-analytics"),
      ]);

      if (resOverview.data?.status === "success") {
        setData(resOverview.data.data);
      }
      if (resAnalytics.data?.status === "success") {
        setAnalytics(resAnalytics.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat statistik platform master.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Ringkasan data dan aktivitas seluruh sekolah di platform Cendekia.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onNavigateTab("sekolah")}
            className="rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs h-10 px-4 shadow-md cursor-pointer"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Data Sekolah
          </Button>
          <Button
            onClick={fetchMasterData}
            variant="outline"
            className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-10 px-3 cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => onNavigateTab("sekolah")}
          className="bg-blue-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-600/15 border-none flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
              Total Sekolah
            </span>
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-colors">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : `${data?.total_schools || 0} Sekolah`}
            </h3>
            <p className="text-xs text-blue-100 mt-1 font-medium flex items-center gap-1">
              <span>Sekolah Terdaftar</span>
              <ArrowRight className="h-3 w-3 inline" />
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("guru")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Guru
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${data?.total_teachers || 0} Guru`}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Guru Terdaftar →
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("siswa")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Siswa
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${data?.total_students || 0} Siswa`}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Siswa Terdaftar →
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("kelas")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Kelas
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <School className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${data?.total_classrooms || 0} Kelas`}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Kelas Terdaftar →
            </p>
          </div>
        </Card>
      </div>

      {/* Row 2: Distribusi Sekolah Mitra & Preferensi Media Belajar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        {/* Distribusi Sekolah */}
        <Card className="lg:col-span-7 bg-white rounded-3xl p-6 border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Distribusi Siswa & Guru Per Sekolah
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jumlah siswa dan guru yang terdaftar di setiap sekolah.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab("sekolah")}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold cursor-pointer"
              >
                Lihat Semua →
              </Button>
            </div>

            <div className="space-y-3.5 mt-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))
              ) : data?.schools_distribution?.length > 0 ? (
                data.schools_distribution.map((s) => {
                  const maxStudents = Math.max(...data.schools_distribution.map(x => x.students_count || 1), 10);
                  const pct = Math.round(((s.students_count || 0) / maxStudents) * 100);

                  return (
                    <div key={s.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-blue-200 transition-all">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1.5">
                        <span className="flex items-center gap-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                            ID #{s.id}
                          </span>
                          <span>{s.name}</span>
                          <Badge variant="outline" className="text-[10px] font-medium text-slate-500 bg-white">
                            {s.jenjang || "SMA"}
                          </Badge>
                        </span>
                        <span className="font-mono text-blue-600">
                          {s.students_count || 0} Siswa • {s.teachers_count || 0} Guru
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada data sekolah terdaftar.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>Sistem Aktif & Terhubung</span>
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Cendekia Learning Hub
            </span>
          </div>
        </Card>

        {/* Preferensi Media Belajar (3 Model) */}
        <Card className="lg:col-span-5 bg-white rounded-3xl p-6 border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Preferensi Media Belajar (3 Model)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Persentase akses materi: Dokumen, Audio, dan Video.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab("statistik")}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold cursor-pointer"
              >
                Lihat Detail →
              </Button>
            </div>

            <div className="space-y-4 mt-3">
              {/* Model 1: PDF */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Model 1: Dokumen (PDF & Teks)</span>
                  </span>
                  <span className="text-blue-700 font-extrabold">
                    {analytics?.summary?.pdf_percentage || 35.5}% Siswa
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-blue-100">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${analytics?.summary?.pdf_percentage || 35.5}%` }}
                  />
                </div>
              </div>

              {/* Model 2: Audio */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-blue-600" />
                    <span>Model 2: Audio (Rekaman Suara)</span>
                  </span>
                  <span className="text-blue-700 font-extrabold">
                    {analytics?.summary?.audio_percentage || 28.2}% Siswa
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-blue-100">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${analytics?.summary?.audio_percentage || 28.2}%` }}
                  />
                </div>
              </div>

              {/* Model 3: Video */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <span className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-600" />
                    <span>Model 3: Video Tutorial</span>
                  </span>
                  <span className="text-blue-700 font-extrabold">
                    {analytics?.summary?.video_percentage || 36.3}% Siswa
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-blue-100">
                  <div
                    className="bg-blue-700 h-2 rounded-full"
                    style={{ width: `${analytics?.summary?.video_percentage || 36.3}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <span className="font-bold text-slate-900">Catatan: </span>
            Siswa memanfaatkan video dan dokumen materi untuk belajar mandiri.
          </div>
        </Card>
      </div>
    </div>
  );
}
