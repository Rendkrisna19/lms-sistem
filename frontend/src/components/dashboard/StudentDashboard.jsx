import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Award,
  BookOpen,
  Clock,
  FileText,
  Volume2,
  Video,
  School,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DocumentCard } from "../materials/DocumentCard";
import { AudioPlayerCard } from "../materials/AudioPlayerCard";
import { VideoPlayerCard } from "../materials/VideoPlayerCard";
import { RecentEvaluationTable } from "./RecentEvaluationTable";
import { BarChartCard } from "./BarChartCard";
import { WaveChartCard } from "./WaveChartCard";
import { DiagnosticsCard } from "./DiagnosticsCard";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export function StudentDashboard({ currentUser, onNavigateTab, onExportCSV }) {
  const [data, setData] = useState(null);
  const [contentFilter, setContentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/student/overview");
      if (res.data?.status === "success") {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat dashboard belajar siswa.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const schoolName = currentUser?.school?.name || data?.student?.school_name || "SMA Mitra Inalum";
  const className = data?.student?.classroom_name || "Teknik Informatika - A";

  return (
    <div className="space-y-6 w-full">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs border-white/20 mb-3 text-xs font-semibold px-3 py-1">
            Portal Siswa • {schoolName} ({className})
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Semangat Belajar, {currentUser?.name || "Ahmad Fajar"}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Akses materi pembelajaran 3 model (Dokumen PDF, Audio Suara, Video Tutorial) dan kerjakan evaluasi belajar mandiri.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onNavigateTab("ruang_belajar")}
            className="rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs h-10 px-4 shadow-md cursor-pointer"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Buka Ruang Belajar
          </Button>
          <Button
            onClick={fetchStudentData}
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
          onClick={() => onNavigateTab("ruang_belajar")}
          className="bg-blue-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-600/15 border-none flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
              Progres Belajar Saya
            </span>
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : `${data?.summary?.learning_progress_pct || 100}%`}
            </h3>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              Semua Modul Tuntas (Lihat →)
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("ruang_belajar")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Modul Terbuka
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              3 Model Ajar
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Dokumen, Suara & Video →
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("nilai")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Nilai Kuis Terakhir
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : data?.summary?.latest_exam_score || 100}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Skor Sempurna (Lulus) →
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("agenda")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Waktu Belajar
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              4j 25m
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Minggu Ini (Lihat Agenda →)
            </p>
          </div>
        </Card>
      </div>

      {/* Row 2: Charts & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        <BarChartCard role="murid" />
        <WaveChartCard role="murid" />
        <DiagnosticsCard />
      </div>

      {/* Row 3: Ruang Belajar Multimedia (3 Model) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Bahan Ajar Multimedia (3 Model Pembelajaran)
            </h2>
            <p className="text-xs text-slate-500">
              Pilih media belajar yang paling sesuai dengan gaya belajar Anda: Dokumen, Audio Suara, atau Video HD
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 text-xs shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContentFilter("all")}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all",
                contentFilter === "all" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Semua (3)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContentFilter("document")}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all",
                contentFilter === "document" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContentFilter("audio")}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all",
                contentFilter === "audio" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Audio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setContentFilter("video")}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-medium cursor-pointer transition-all",
                contentFilter === "video" ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Video
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(contentFilter === "all" || contentFilter === "document") && <DocumentCard />}
          {(contentFilter === "all" || contentFilter === "audio") && <AudioPlayerCard />}
          {(contentFilter === "all" || contentFilter === "video") && <VideoPlayerCard />}
        </div>
      </div>

      {/* Row 4: Evaluasi Terkini */}
      <RecentEvaluationTable
        role="murid"
        onExportCSV={onExportCSV}
      />
    </div>
  );
}
