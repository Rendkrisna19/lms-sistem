import React, { useState, useEffect } from "react";
import {
  Activity,
  FileText,
  Volume2,
  Video,
  Search,
  Building2,
  School,
  GraduationCap,
  RefreshCw,
  Sparkles,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  ArrowUpDown
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { api } from "../lib/api";
import { toast } from "sonner";

export function StatsPage({ currentUser }) {
  const [analytics, setAnalytics] = useState(null);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isTeacher = currentUser?.role === "guru";

  // Fetch list of schools for filter (only for admin/master)
  const fetchSchools = async () => {
    try {
      const res = await api.get("/admin/schools");
      if (res.data?.status === "success") {
        setSchools(res.data.data);
      }
    } catch (e) {
      console.warn("Could not load schools:", e);
    }
  };

  // Fetch learning analytics data
  const fetchAnalytics = async (schoolId = selectedSchool) => {
    try {
      setIsLoading(true);
      let url = "/master/learning-analytics";
      if (isTeacher) {
        url = currentUser?.id
          ? `/teacher/learning-analytics?teacher_id=${currentUser.id}`
          : "/teacher/learning-analytics";
      } else if (schoolId !== "all") {
        url = `/master/learning-analytics?school_id=${schoolId}`;
      }

      const res = await api.get(url);
      if (res.data?.status === "success") {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat analitik preferensi media belajar siswa.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isTeacher) {
      fetchSchools();
    }
    fetchAnalytics("all");
  }, [currentUser?.id, currentUser?.role]);

  const handleSchoolChange = (val) => {
    setSelectedSchool(val);
    fetchAnalytics(val);
  };

  const studentsList = analytics?.students || [];

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.nis?.toLowerCase().includes(search.toLowerCase()) ||
      s.classroom_name?.toLowerCase().includes(search.toLowerCase());

    const matchesMedia =
      mediaFilter === "all" ||
      (mediaFilter === "pdf" && s.dominant_style?.includes("PDF")) ||
      (mediaFilter === "audio" && s.dominant_style?.includes("Audio")) ||
      (mediaFilter === "video" && s.dominant_style?.includes("Video"));

    return matchesSearch && matchesMedia;
  });

  const summary = analytics?.summary || {
    total_students_analyzed: 4,
    pdf_percentage: 35.5,
    audio_percentage: 28.2,
    video_percentage: 36.3,
  };

  const schoolOptions = [
    { value: "all", label: "Semua Sekolah" },
    ...schools.map((sc) => ({
      value: sc.id,
      label: sc.name,
    })),
  ];

  const mediaOptions = [
    { value: "all", label: "Semua Model Media" },
    { value: "pdf", label: "Dokumen (PDF)" },
    { value: "audio", label: "Audio (Suara)" },
    { value: "video", label: "Video Tutorial" },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {isTeacher ? "Keaktifan & Preferensi Belajar Siswa (Rombel Ajar)" : "Statistik Sistem"}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isTeacher
              ? `Analisis pemanfaatan media pembelajaran multimedia 3 model khusus murid di kelas yang Anda bimbing.`
              : "Analisis preferensi belajar siswa berdasarkan akses materi dokumen, audio, dan video."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(selectedSchool)}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* KPI Cards: Media Access Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Siswa</span>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.total_students_analyzed || 0} Siswa
          </div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">
            Siswa dianalisis
          </p>
        </Card>

        {/* Model 1: PDF */}
        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Dokumen (PDF)</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.pdf_percentage}%
          </div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">
            Persentase akses
          </p>
        </Card>

        {/* Model 2: Voice Audio */}
        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Audio (Suara)</span>
            <Volume2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.audio_percentage}%
          </div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">
            Persentase akses
          </p>
        </Card>

        {/* Model 3: Video */}
        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Video Tutorial</span>
            <Video className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.video_percentage}%
          </div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">
            Persentase akses
          </p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-3xl border-slate-200/80 bg-white overflow-hidden shadow-xs">
        {/* Table Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari siswa, NIS, kelas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
              />
            </div>

            {/* School Filter (Only for Admin Master / Global) */}
            {!isTeacher && (
              <div className="w-full sm:w-52">
                <CustomSelect
                  value={selectedSchool}
                  onChange={handleSchoolChange}
                  options={schoolOptions}
                  placeholder="Filter Sekolah"
                  icon={Building2}
                />
              </div>
            )}

            {/* Media Style Filter */}
            <div className="w-full sm:w-48">
              <CustomSelect
                value={mediaFilter}
                onChange={(val) => setMediaFilter(val)}
                options={mediaOptions}
                placeholder="Model Media"
                icon={BarChart3}
                searchable={false}
              />
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium shrink-0">
            Total: <strong className="text-slate-700">{filteredStudents.length} Siswa</strong>
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <Table className="w-full text-xs sm:text-sm">
            <TableHeader className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
              <TableRow>
                <TableHead className="py-3 px-4 w-12">NO</TableHead>
                <TableHead className="py-3 px-4">NAMA SISWA</TableHead>
                <TableHead className="py-3 px-4">SEKOLAH & KELAS</TableHead>
                <TableHead className="py-3 px-4 text-center">DOKUMEN (PDF)</TableHead>
                <TableHead className="py-3 px-4 text-center">AUDIO</TableHead>
                <TableHead className="py-3 px-4 text-center">VIDEO</TableHead>
                <TableHead className="py-3 px-4 text-center">PREFERENSI</TableHead>
                <TableHead className="py-3 px-4 text-right">PACE BELAJAR</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="py-4 px-4">
                      <Skeleton className="h-7 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {search ? "Tidak ada siswa yang cocok dengan filter." : "Belum ada data analitik media belajar siswa."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((s, idx) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</TableCell>

                    {/* Nama & NIS */}
                    <TableCell className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">
                          {s.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          NIS: {s.nis}
                        </p>
                      </div>
                    </TableCell>

                    {/* Sekolah & Kelas */}
                    <TableCell className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="font-semibold text-slate-800 text-xs block">
                          {s.school_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">
                          {s.classroom_name}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* PDF Access */}
                    <TableCell className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">
                        <FileText className="h-3 w-3 text-blue-600" />
                        {s.pdf_access_count}x
                      </span>
                    </TableCell>

                    {/* Audio Access */}
                    <TableCell className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">
                        <Volume2 className="h-3 w-3 text-blue-600" />
                        {s.audio_access_count}x
                      </span>
                    </TableCell>

                    {/* Video Access */}
                    <TableCell className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-xs">
                        <Video className="h-3 w-3 text-blue-600" />
                        {s.video_access_count}x
                      </span>
                    </TableCell>

                    {/* Tipe Dominan */}
                    <TableCell className="py-3.5 px-4 text-center">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2.5 py-0.5">
                        {s.dominant_style}
                      </Badge>
                    </TableCell>

                    {/* Pace Belajar */}
                    <TableCell className="py-3.5 px-4 text-right">
                      <span className="text-xs font-medium text-slate-600">
                        {s.learning_pace}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
