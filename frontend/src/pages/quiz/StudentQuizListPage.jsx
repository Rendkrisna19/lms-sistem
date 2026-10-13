import { useMemo, useState } from "react";
import { Award, Clock, CheckCircle2, PlayCircle, RefreshCw, Search } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { Alert } from "../../components/ui/alert";
import { StudentQuizCard } from "../../components/quiz/student/StudentQuizCard";
import { isStartable, studentQuizState } from "../../features/quiz/studentQuizState";

export function StudentQuizListPage() {
  const { data, error, isLoading, reload } = useApiQuery("/student/quizzes");
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  const quizzes = useMemo(() => data?.quizzes ?? [], [data]);
  const classroom = data?.classroom;

  const stats = useMemo(() => {
    let availableCount = 0;
    let inProgressCount = 0;
    let finishedCount = 0;

    quizzes.forEach((q) => {
      const state = studentQuizState(q);
      if (isStartable(state)) availableCount++;
      else if (state === "in_progress") inProgressCount++;
      else if (state === "finished") finishedCount++;
    });

    return {
      total: quizzes.length,
      available: availableCount,
      inProgress: inProgressCount,
      finished: finishedCount,
    };
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quizzes.filter((item) => {
      const state = studentQuizState(item);
      if (filterTab === "available" && !isStartable(state)) return false;
      if (filterTab === "in_progress" && state !== "in_progress") return false;
      if (filterTab === "finished" && state !== "finished") return false;

      if (!q) return true;
      return (
        item.title?.toLowerCase().includes(q) ||
        item.course?.title?.toLowerCase().includes(q) ||
        item.teacher?.name?.toLowerCase().includes(q) ||
        item.instructions?.toLowerCase().includes(q)
      );
    });
  }, [quizzes, search, filterTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ujian & Evaluasi Online"
        description={
          classroom
            ? `Daftar kuis dan evaluasi pembelajaran untuk kelas ${classroom.name} (${classroom.code}).`
            : "Daftar kuis dan evaluasi pembelajaran kelas Anda."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isLoading}
            className="rounded-xl border-slate-200 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            Perbarui
          </Button>
        }
      />

      {error && (
        <Alert variant="danger">
          Gagal memuat daftar ujian online: {error.message || "Terjadi kesalahan pada server."}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Ujian</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{stats.total}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Seluruh kuis kelas</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Siap Dikerjakan</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PlayCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{stats.available}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Bisa mulai sekarang</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sedang Berjalan</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{stats.inProgress}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sesi belum selesai</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Selesai Dikerjakan</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800">{stats.finished}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Nilai telah tercatat</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "Semua Ujian", count: stats.total },
            { id: "available", label: "Tersedia", count: stats.available },
            { id: "in_progress", label: "Sedang Dikerjakan", count: stats.inProgress },
            { id: "finished", label: "Selesai", count: stats.finished },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                filterTab === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari judul atau mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200/80 focus:bg-white"
          />
        </div>
      </div>

      {/* Quizzes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <div className="grid grid-cols-3 gap-2 py-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
          <EmptyState
            icon={Award}
            title={search ? "Tidak ada ujian yang cocok" : "Belum ada ujian online"}
            description={
              search
                ? `Tidak ditemukan ujian yang sesuai dengan kata kunci "${search}".`
                : "Guru pengampu kelas Anda belum mempublikasikan ujian atau jadwal kuis baru."
            }
            action={
              search ? (
                <Button variant="outline" size="sm" onClick={() => setSearch("")} className="rounded-xl text-xs cursor-pointer">
                  Hapus Pencarian
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredQuizzes.map((quiz) => (
            <StudentQuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
