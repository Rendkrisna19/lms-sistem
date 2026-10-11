import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Award,
  Users,
  School,
  FileText,
  Volume2,
  Video,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DocumentCard } from "../materials/DocumentCard";
import { AudioPlayerCard } from "../materials/AudioPlayerCard";
import { VideoPlayerCard } from "../materials/VideoPlayerCard";
import { RecentEvaluationTable } from "./RecentEvaluationTable";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export function TeacherDashboard({ currentUser, onExportCSV, onNavigateTab }) {
  const [data, setData] = useState(null);
  const [contentFilter, setContentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeacherData = async () => {
    try {
      setIsLoading(true);
      const url = currentUser?.id ? `/teacher/overview?teacher_id=${currentUser.id}` : "/teacher/overview";
      const res = await api.get(url);
      if (res.data?.status === "success") {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat dashboard guru pengampu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [currentUser?.id]);

  const schoolName = currentUser?.school?.name || data?.teacher?.school_name || "SMA Mitra Inalum";
  const teacherCourse = data?.assigned_courses?.[0]?.title || "Mata Pelajaran Ditugaskan";

  return (
    <div className="space-y-6 w-full">
      {/* Teacher Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs border-white/20 mb-3 text-xs font-semibold px-3 py-1">
            Portal Guru Pengampu • {schoolName}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Selamat Datang, {currentUser?.name || data?.teacher?.name || "Dr. Hendra Wijaya, M.T."}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
            Pengampu Mapel: <span className="font-bold underline decoration-blue-300">{teacherCourse}</span>. Kelola materi 3 model (Dokumen, Audio, Video), jadwalkan ujian kuis, dan pantau hasil evaluasi murid sesuai plotting kelas.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onNavigateTab("materi")}
            className="rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs h-10 px-4 shadow-md cursor-pointer"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Upload Materi Ajar
          </Button>
          <Button
            onClick={fetchTeacherData}
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
          onClick={() => onNavigateTab("ujian")}
          className="bg-blue-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-600/15 border-none flex flex-col justify-between cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
              Ujian & Kuis Aktif
            </span>
            <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-colors">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : `${data?.summary?.total_quizzes || 1} Kuis`}
            </h3>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              Sesuai Mapel yang Diampu →
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("materi")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Bahan Ajar Terunggah
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
              PDF, Audio & Video HD →
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("rekap")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Siswa Bimbingan
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${data?.summary?.total_students_guided || data?.students?.length || 2} Siswa`}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Siswa Terdaftar di Rombel →
            </p>
          </div>
        </Card>

        <Card
          onClick={() => onNavigateTab("rekap")}
          className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Rerata Nilai Ujian
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? "..." : `${data?.summary?.average_student_score || 91.5}`}
            </h3>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Skala Evaluasi 100 Poin →
            </p>
          </div>
        </Card>
      </div>

      {/* Row 2: Kelas & Mata Pelajaran yang Ditugaskan (Plotting Mapel) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <School className="h-5 w-5 text-blue-600" />
              Plotting Mapel & Rombongan Belajar yang Ditugaskan
            </h2>
            <p className="text-xs text-slate-500">
              Daftar kelas ajar, jadwal tatap muka, ruang kelas, dan murid terdaftar yang dibimbing sesuai plotting mapel
            </p>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-3 py-1 font-semibold self-start sm:self-auto">
            {data?.assigned_classrooms?.length || 1} Kelas Terdaftar
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data?.assigned_classrooms?.map((cls) => {
            const assignment = cls.subjectAssignments?.[0];
            const classStudents = data?.students?.filter((s) => s.classroom_id === cls.id) || [];

            return (
              <Card key={cls.id} className="bg-white border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">{cls.name}</h3>
                      <Badge className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
                        {cls.code}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Tahun Ajaran: {cls.academic_year || "2026/2027"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      {cls.students_count || classStudents.length} Siswa
                    </span>
                  </div>
                </div>

                {/* Plotting Assignment Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Mata Pelajaran:</span>
                    <span className="font-bold text-slate-900">
                      {assignment?.course?.title || data?.assigned_courses?.[0]?.title || "Mata Pelajaran Ditugaskan"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Jadwal Pertemuan:</span>
                    <span className="font-semibold text-slate-700">
                      {assignment?.schedule_day ? `${assignment.schedule_day}, ${assignment.schedule_time || '10:00 - 12:00'}` : "Rabu, 10:15 - 12:00"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Ruang Kelas / Lab:</span>
                    <span className="font-semibold text-slate-700">
                      {assignment?.room || "Lab Komputer"}
                    </span>
                  </div>
                </div>

                {/* Enrolled Students Roster */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      Murid Terdaftar di Kelas Ini ({classStudents.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {classStudents.map((std) => (
                      <div key={std.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 text-xs">
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px] shrink-0">
                          {std.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate leading-tight">{std.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NIS: {std.nis}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Row 3: Bahan Ajar Multimedia 3 Model */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Bahan Ajar Multimedia (3 Model Pembelajaran)
            </h2>
            <p className="text-xs text-slate-500">
              Materi pembelajaran terintegrasi: Dokumen Ringkasan, Rekaman Suara Vokal, dan Video Interaktif
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

      {/* Row 4: Riwayat Evaluasi Siswa Sesuai Plotting Mapel */}
      <RecentEvaluationTable
        role="guru"
        students={data?.recent_submissions}
        onExportCSV={onExportCSV}
        title="Rekapitulasi Nilai Ujian Siswa (Sesuai Kelas & Mapel Ajar)"
        subtitle={data?.recent_submissions?.[0]?.quiz_title || "Evaluasi Hasil Belajar Peserta Didik"}
      />
    </div>
  );
}
