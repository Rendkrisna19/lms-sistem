import React, { useState, useEffect } from "react";
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  HelpCircle,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Calendar,
  School,
  BookOpen,
  FileSpreadsheet,
  FileText,
  FileQuestion,
  ToggleLeft,
  ToggleRight,
  Layers,
  Sparkles,
  Check,
  ChevronRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { Pagination } from "../components/ui/pagination";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { QuizFormModal } from "../components/modals/QuizFormModal";
import { QuizDetailModal } from "../components/modals/QuizDetailModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { toast } from "sonner";
import { api } from "../lib/api";

export function QuizPage({ currentUser, onReturnToDashboard }) {
  const role = currentUser?.role || "murid";
  const isTeacher = role === "guru";

  // ==========================================
  // 1. TEACHER STATE & MANAGEMENT
  // ==========================================
  const [quizzes, setQuizzes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [assignedOptions, setAssignedOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [detailQuiz, setDetailQuiz] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // ==========================================
  // 2. STUDENT CBT STATE
  // ==========================================
  const [studentQuizzes, setStudentQuizzes] = useState([]);
  const [selectedQuizForCbt, setSelectedQuizForCbt] = useState(null);
  const [quizState, setQuizState] = useState("list"); // 'list' | 'active' | 'result'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedDoubts, setMarkedDoubts] = useState({});
  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [quizScoreResult, setQuizScoreResult] = useState(null);

  // Fetch Quizzes from API
  const fetchQuizzes = async () => {
    setIsLoading(true);
    try {
      if (isTeacher) {
        const res = await api.get("/teacher/quizzes", {
          params: { teacher_id: currentUser?.id },
        });
        if (res.data?.status === "success") {
          const dt = res.data.data;
          setQuizzes(dt.quizzes || []);
          setSummary(dt.summary || null);
          setAssignedOptions(dt.assigned_options || []);
        }
      } else {
        // Student view
        const res = await api.get("/student/quizzes");
        if (res.data?.status === "success") {
          setStudentQuizzes(res.data.data.quizzes || []);
        }
      }
    } catch (err) {
      console.error("Gagal memuat ujian:", err);
      toast.error("Gagal mengambil data ujian dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [currentUser?.id, role]);

  // Open Detail Quiz
  const handleOpenDetail = async (q) => {
    try {
      const res = await api.get(`/teacher/quizzes/${q.id}`);
      if (res.data?.status === "success") {
        setDetailQuiz(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal mengambil rincian soal ujian.");
    }
  };

  // Open Edit Quiz
  const handleOpenEdit = async (q) => {
    try {
      const res = await api.get(`/teacher/quizzes/${q.id}`);
      if (res.data?.status === "success") {
        setQuizToEdit(res.data.data);
        setIsFormModalOpen(true);
      }
    } catch (err) {
      toast.error("Gagal memuat data ujian untuk diedit.");
    }
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (item) => {
    setTogglingId(item.id);
    try {
      const res = await api.patch(`/teacher/quizzes/${item.id}/toggle-status`, {}, {
        params: { teacher_id: currentUser?.id }
      });
      if (res.data?.status === "success") {
        const updated = res.data.data;
        setQuizzes((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, is_active: updated.is_active, status_state: updated.status_state } : q))
        );
        toast.success(res.data.message || `Status ujian "${item.title}" diperbarui.`);
        fetchQuizzes();
      }
    } catch (err) {
      toast.error("Gagal mengubah status ujian.");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Quiz
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/teacher/quizzes/${deleteTarget.id}`, {
        params: { teacher_id: currentUser?.id }
      });
      if (res.data?.status === "success") {
        toast.success(res.data.message || "Ujian berhasil dihapus.");
        setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
        setDeleteTarget(null);
        fetchQuizzes();
      }
    } catch (err) {
      toast.error("Gagal menghapus ujian.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Student CBT Timer Logic
  useEffect(() => {
    let interval = null;
    if (quizState === "active" && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitStudentQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizState, timerSeconds]);

  const handleStartStudentQuiz = async (q) => {
    try {
      const res = await api.get(`/quizzes/${q.id}`);
      const fullQuiz = res.data?.data || q;
      setSelectedQuizForCbt(fullQuiz);
      setUserAnswers({});
      setMarkedDoubts({});
      setCurrentQuestionIndex(0);
      setTimerSeconds((fullQuiz.duration_minutes || 30) * 60);
      setQuizState("active");
    } catch (err) {
      // Fallback
      setSelectedQuizForCbt(q);
      setUserAnswers({});
      setMarkedDoubts({});
      setCurrentQuestionIndex(0);
      setTimerSeconds((q.duration_minutes || 30) * 60);
      setQuizState("active");
    }
  };

  const handleSubmitStudentQuiz = () => {
    if (!selectedQuizForCbt) return;
    const questions = selectedQuizForCbt.questions || [];
    let correctCount = 0;
    let earnedPoints = 0;
    let totalPoints = 0;

    questions.forEach((q) => {
      const correctOption = q.options?.find((opt) => opt.is_correct);
      const userSelected = userAnswers[q.id];
      const qPoints = q.points || 10;
      totalPoints += qPoints;

      if (correctOption && userSelected === correctOption.option_label) {
        correctCount++;
        earnedPoints += qPoints;
      }
    });

    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
    const isPassed = finalScore >= (selectedQuizForCbt.passing_score || 70);

    setQuizScoreResult({
      score: finalScore,
      isPassed,
      correctCount,
      totalQuestions: questions.length,
    });
    setQuizState("result");
    toast.success(`Ujian selesai! Skor Anda: ${finalScore}/100`);
  };

  // Teacher Filter Logic
  const filteredQuizzes = quizzes.filter((item) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.instructions?.toLowerCase().includes(q);
      const matchCourse = item.course?.title?.toLowerCase().includes(q);
      const matchClass = item.classroom?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCourse && !matchClass) return false;
    }

    if (selectedClassroom !== "all") {
      if (String(item.classroom_id) !== String(selectedClassroom)) return false;
    }

    if (selectedStatus !== "all") {
      if (item.status_state !== selectedStatus) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredQuizzes.length / itemsPerPage) || 1;
  const paginatedQuizzes = filteredQuizzes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const classroomOptions = [
    { value: "all", label: "Semua Rombel / Kelas" },
    ...assignedOptions.map((opt) => ({
      value: String(opt.classroom_id),
      label: `${opt.classroom_name} (${opt.classroom_code})`,
    })),
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status Pelaksanaan" },
    { value: "active", label: "Aktif Berjalan" },
    { value: "upcoming", label: "Terjadwal (Akan Datang)" },
    { value: "closed", label: "Ujian Ditutup" },
    { value: "inactive", label: "Draf / Nonaktif" },
  ];

  // ==========================================
  // RENDER TEACHER VIEW
  // ==========================================
  if (isTeacher) {
    return (
      <div className="space-y-6">
        {/* 1. Header Page */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Manajemen Ujian & Kuis Online (CBT)
              </h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                Role Guru Pengampu
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola butir soal, kunci jawaban, durasi waktu, dan jadwal buka-tutup ujian khusus untuk rombongan belajar Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Fitur Export Excel akan segera tersedia.")}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9 gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Fitur Export PDF akan segera tersedia.")}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9 gap-1.5"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>Export PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuizzes}
              disabled={isLoading}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setQuizToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 shadow-md shadow-blue-500/20 cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Ujian Baru
            </Button>
          </div>
        </div>

        {/* 2. KPI Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Card className="rounded-2xl border border-slate-200/80 p-4 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Ujian</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900">{summary.total}</span>
                <span className="text-xs text-slate-400">paket</span>
              </div>
            </Card>

            <Card className="rounded-2xl border border-emerald-100 p-4 bg-emerald-50/30 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Aktif Berjalan
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-emerald-700">{summary.total_active}</span>
                <span className="text-xs text-emerald-400">dapat diakses</span>
              </div>
            </Card>

            <Card className="rounded-2xl border border-indigo-100 p-4 bg-indigo-50/30 shadow-2xs">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Terjadwal
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-indigo-700">{summary.total_upcoming}</span>
                <span className="text-xs text-indigo-400">akan datang</span>
              </div>
            </Card>

            <Card className="rounded-2xl border border-blue-100 p-4 bg-blue-50/30 shadow-2xs">
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <FileQuestion className="h-3.5 w-3.5" /> Total Bank Soal
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-blue-700">{summary.total_questions}</span>
                <span className="text-xs text-blue-400">butir soal</span>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 p-4 bg-slate-50 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Draf Nonaktif</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-600">{summary.total_inactive}</span>
                <span className="text-xs text-slate-400">disimpan</span>
              </div>
            </Card>
          </div>
        )}

        {/* 3. Main Quizzes Table */}
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden">
          {/* Table Filter Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-4xl">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Cari judul ujian, materi evaluasi, mapel..."
                  className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
                />
              </div>

              {/* Filter Kelas Rombel */}
              {assignedOptions.length > 0 && (
                <div className="w-full sm:w-56 shrink-0">
                  <CustomSelect
                    value={selectedClassroom}
                    onChange={(val) => {
                      setSelectedClassroom(val);
                      setCurrentPage(1);
                    }}
                    options={classroomOptions}
                  />
                </div>
              )}

              {/* Filter Status */}
              <div className="w-full sm:w-52 shrink-0">
                <CustomSelect
                  value={selectedStatus}
                  onChange={(val) => {
                    setSelectedStatus(val);
                    setCurrentPage(1);
                  }}
                  options={statusOptions}
                />
              </div>
            </div>

            <span className="text-xs text-slate-400 font-medium shrink-0">
              Total Ditemukan: <strong className="text-slate-700">{filteredQuizzes.length} Ujian</strong>
            </span>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                <TableRow>
                  <TableHead className="py-3 px-4 w-12 text-center">NO</TableHead>
                  <TableHead className="py-3 px-4">JUDUL UJIAN & MAPEL</TableHead>
                  <TableHead className="py-3 px-4">KELAS (ROMBEL)</TableHead>
                  <TableHead className="py-3 px-4">PENJADWALAN (BUKA - TUTUP)</TableHead>
                  <TableHead className="py-3 px-4">DURASI & KKM</TableHead>
                  <TableHead className="py-3 px-4 text-center">JUMLAH SOAL</TableHead>
                  <TableHead className="py-3 px-4 text-center">STATUS</TableHead>
                  <TableHead className="py-3 px-4 text-right">AKSI</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-4 px-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="py-4 px-4"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                      <TableCell className="py-4 px-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                      <TableCell className="py-4 px-4 text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedQuizzes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <Award className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">Tidak ada ujian ditemukan</span>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Belum ada paket ujian & kuis online yang dibuat sesuai kriteria filter saat ini.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setQuizToEdit(null);
                            setIsFormModalOpen(true);
                          }}
                          className="mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Buat Ujian Baru
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuizzes.map((item, index) => {
                    const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    const isInactive = item.status_state === "inactive";
                    const isUpcoming = item.status_state === "upcoming";
                    const isClosed = item.status_state === "closed";

                    return (
                      <TableRow
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !item.is_active ? "opacity-60 bg-slate-50/40" : ""
                        }`}
                      >
                        {/* NO */}
                        <TableCell className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                          {itemNumber}
                        </TableCell>

                        {/* JUDUL & MAPEL */}
                        <TableCell className="py-4 px-4">
                          <div className="max-w-md">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                              {item.title}
                            </h4>
                            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
                              {item.course?.title || "Mata Pelajaran"}
                            </span>
                            {item.instructions && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                                {item.instructions}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        {/* KELAS ROMBEL */}
                        <TableCell className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">
                              {item.classroom?.name || "Semua Kelas"}
                            </span>
                            {item.classroom?.code && (
                              <Badge variant="secondary" className="w-fit text-[10px] font-mono mt-1 px-1.5 py-0 bg-slate-100 text-slate-600">
                                {item.classroom?.code}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* PENJADWALAN */}
                        <TableCell className="py-4 px-4 whitespace-nowrap text-xs">
                          {item.starts_at || item.ends_at ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                <span>
                                  {item.starts_at
                                    ? new Date(item.starts_at).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }) + " WIB"
                                    : "Mulai Sekarang"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Calendar className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                <span>
                                  s/d{" "}
                                  {item.ends_at
                                    ? new Date(item.ends_at).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }) + " WIB"
                                    : "Tanpa Batas"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-medium">
                              Fleksibel Tanpa Jadwal
                            </Badge>
                          )}
                        </TableCell>

                        {/* DURASI & KKM */}
                        <TableCell className="py-4 px-4 whitespace-nowrap text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block">
                              {item.duration_minutes} Menit
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold block">
                              KKM: {item.passing_score} / 100
                            </span>
                          </div>
                        </TableCell>

                        {/* JUMLAH SOAL */}
                        <TableCell className="py-4 px-4 text-center whitespace-nowrap">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                            {item.total_questions} Soal
                          </Badge>
                        </TableCell>

                        {/* STATUS */}
                        <TableCell className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            disabled={togglingId === item.id}
                            title="Klik untuk mengubah status ujian"
                            className="inline-flex items-center gap-1.5 cursor-pointer group transition-all"
                          >
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-bold px-2.5 py-1 transition-all ${
                                isInactive
                                  ? "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-200"
                                  : isClosed
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : isUpcoming
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full mr-1.5 ${
                                  item.is_active && !isClosed && !isUpcoming
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-slate-400"
                                }`}
                              />
                              {isInactive
                                ? "Nonaktif"
                                : isClosed
                                ? "Ditutup"
                                : isUpcoming
                                ? "Akan Datang"
                                : "Aktif"}
                            </Badge>
                          </button>
                        </TableCell>

                        {/* AKSI */}
                        <TableCell className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Tombol Detail & Bank Soal */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetail(item)}
                              title="Lihat Soal & Kunci Jawaban"
                              className="h-8 px-2 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer text-xs gap-1 font-semibold"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Bank Soal</span>
                            </Button>

                            {/* Tombol Edit */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Ujian & Soal"
                              className="h-8 px-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            {/* Tombol Toggle Status */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(item)}
                              disabled={togglingId === item.id}
                              title={item.is_active ? "Nonaktifkan Ujian" : "Aktifkan Ujian"}
                              className={`h-8 px-1.5 rounded-xl cursor-pointer ${
                                item.is_active
                                  ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {item.is_active ? (
                                <ToggleRight className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-slate-400" />
                              )}
                            </Button>

                            {/* Tombol Hapus */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(item)}
                              title="Hapus Ujian"
                              className="h-8 px-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Menampilkan {paginatedQuizzes.length} dari {filteredQuizzes.length} paket ujian
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>

        {/* 4. Modals */}
        {/* Form Modal (Create / Edit) */}
        <QuizFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setQuizToEdit(null);
          }}
          onSuccess={fetchQuizzes}
          assignedOptions={assignedOptions}
          quizToEdit={quizToEdit}
          currentUser={currentUser}
        />

        {/* Detail Modal */}
        <QuizDetailModal
          isOpen={!!detailQuiz}
          onClose={() => setDetailQuiz(null)}
          quiz={detailQuiz}
        />

        {/* Confirm Delete Modal */}
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Hapus Paket Ujian"
          description="Apakah Anda yakin ingin menghapus paket ujian ini beserta seluruh butir soal dan data riwayat pengerjaannya? Tindakan ini tidak dapat dibatalkan."
          itemName={deleteTarget?.title}
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER STUDENT VIEW (CBT UJIAN ONLINE)
  // ==========================================
  if (quizState === "active" && selectedQuizForCbt) {
    const questions = selectedQuizForCbt.questions || [];
    const currentQ = questions[currentQuestionIndex] || null;
    const progressPct = questions.length > 0 ? Math.round(((currentQuestionIndex + 1) / questions.length) * 100) : 0;
    const answeredCount = Object.keys(userAnswers).length;

    const formatTimer = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* CBT Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {selectedQuizForCbt.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Soal {currentQuestionIndex + 1} dari {questions.length} • Terjawab: {answeredCount}/{questions.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-sm ${
              timerSeconds < 300 ? "bg-red-50 border-red-200 text-red-600 animate-pulse" : "bg-blue-50 border-blue-200 text-blue-700"
            }`}>
              <Clock className="h-4 w-4" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>

            <Button
              size="sm"
              onClick={handleSubmitStudentQuiz}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 cursor-pointer font-bold shadow-xs"
            >
              Kumpulkan Ujian
            </Button>
          </div>
        </div>

        {/* Question Board */}
        {currentQ && (
          <Card className="rounded-3xl border border-slate-200/80 p-6 sm:p-8 bg-white shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">
                Soal Nomor {currentQuestionIndex + 1}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Bobot: {currentQ.points || 10} Poin
              </span>
            </div>

            <div
              className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: currentQ.question_text }}
            />

            {currentQ.image_url && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 max-w-md">
                <img src={currentQ.image_url} alt="Gambar Soal" className="w-full h-auto max-h-72 object-contain" />
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options?.map((opt) => {
                const isSelected = userAnswers[currentQ.id] === opt.option_label;
                return (
                  <button
                    key={opt.id || opt.option_label}
                    type="button"
                    onClick={() => setUserAnswers((prev) => ({ ...prev, [currentQ.id]: opt.option_label }))}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50/80 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                      }`}>
                        {opt.option_label}
                      </span>
                      <div>
                        {opt.option_text && <span className="text-xs sm:text-sm font-medium">{opt.option_text}</span>}
                        {opt.image_url && (
                          <img src={opt.image_url} alt="Opsi Gambar" className="mt-2 h-16 w-auto rounded-lg border border-slate-200 object-contain bg-white" />
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="rounded-xl text-xs"
              >
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-1">
                {questions.map((q, idx) => (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentQuestionIndex === idx
                        ? "bg-blue-600 text-white shadow-xs"
                        : userAnswers[q.id]
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                onClick={() => {
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex((prev) => prev + 1);
                  } else {
                    handleSubmitStudentQuiz();
                  }
                }}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                {currentQuestionIndex < questions.length - 1 ? "Selanjutnya" : "Kumpulkan"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  if (quizState === "result" && quizScoreResult) {
    return (
      <div className="max-w-md mx-auto my-8">
        <Card className="rounded-3xl border border-slate-200/80 p-8 bg-white shadow-lg text-center space-y-5">
          <div className={`h-16 w-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg ${
            quizScoreResult.isPassed ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-red-500 text-white shadow-red-500/20"
          }`}>
            <Award className="h-8 w-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hasil Evaluasi Ujian</span>
            <div className="text-4xl font-black text-slate-900 mt-1">{quizScoreResult.score} / 100</div>
            <Badge className={`mt-2 text-xs px-3 py-1 font-bold ${
              quizScoreResult.isPassed ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {quizScoreResult.isPassed ? "Dinyatakan Lulus (Memenuhi KKM)" : "Remedial (Belum Memenuhi KKM)"}
            </Badge>
          </div>

          <p className="text-xs text-slate-500">
            Anda menjawab benar {quizScoreResult.correctCount} dari {quizScoreResult.totalQuestions} butir soal.
          </p>

          <Button
            onClick={() => {
              setQuizState("list");
              setSelectedQuizForCbt(null);
            }}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs h-10 font-bold"
          >
            Kembali ke Daftar Ujian
          </Button>
        </Card>
      </div>
    );
  }

  // Student Quizzes List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Ruang Ujian & Evaluasi Online (CBT)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar ujian dan kuis yang tersedia sesuai rombongan belajar kelas Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {studentQuizzes.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            Belum ada ujian atau kuis yang dijadwalkan untuk kelas Anda saat ini.
          </div>
        ) : (
          studentQuizzes.map((quiz) => (
            <Card key={quiz.id} className="rounded-3xl border border-slate-200/80 p-6 bg-white shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]">
                    {quiz.course?.title || "Mata Pelajaran"}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {quiz.duration_minutes} Menit
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {quiz.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {quiz.instructions || "Kerjakan soal evaluasi dengan teliti dan jujur."}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span>KKM: <strong>{quiz.passing_score}</strong></span>
                  <span>Soal: <strong>{quiz.total_questions || 4} Butir</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-3">
                {quiz.has_attempted ? (
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-500">Sudah Dikerjakan:</span>
                    <span className="font-bold text-slate-800">{quiz.attempt_score}/100 ({quiz.is_passed ? "Lulus" : "Remedial"})</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleStartStudentQuiz(quiz)}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 cursor-pointer shadow-xs gap-1.5"
                  >
                    <span>Mulai Kerjakan Ujian</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
