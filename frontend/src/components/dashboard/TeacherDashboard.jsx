import { useMemo } from "react";
import { Award, BarChart3, BookOpen, RefreshCw, School, Users } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Alert } from "../ui/alert";
import { StatCard } from "../ui/stat-card";
import { EmptyState } from "../ui/empty-state";
import { RecentEvaluationTable } from "./RecentEvaluationTable";
import { TeacherClassCard } from "./teacher/TeacherClassCard";
import { TeacherMaterialsPanel } from "./teacher/TeacherMaterialsPanel";

/** Dashboard guru: ringkasan, rombel ajar beserta mapel & murid, materi terbaru, dan rekap ujian. */
export function TeacherDashboard({ currentUser, onExportCSV, onNavigateTab }) {
  const overview = useApiQuery("/teacher/overview", { select: (body) => body.data });
  const data = overview.data;
  const isLoading = overview.isLoading;

  const studentsByClass = useMemo(() => {
    const map = new Map();
    (data?.students ?? []).forEach((student) => {
      const list = map.get(student.classroom_id) ?? [];
      list.push(student);
      map.set(student.classroom_id, list);
    });
    return map;
  }, [data?.students]);

  const schoolName = currentUser?.school?.name || data?.teacher?.school_name;
  const teacherName = currentUser?.name || data?.teacher?.name;
  const courses = (data?.assigned_courses ?? []).map((course) => course.title).filter(Boolean);
  const subtitleCourses = courses.length ? courses.join(", ") : "belum ada mapel yang diampu";
  const classrooms = data?.assigned_classrooms ?? [];
  const teacherId = data?.teacher?.id ?? currentUser?.id;

  return (
    <div className="w-full space-y-6">
      <div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-linear-to-r from-brand-700 via-brand-600 to-indigo-700 p-6 text-white shadow-xl shadow-brand-500/10 sm:p-8 md:flex-row md:items-center">
        <div className="max-w-xl">
          {schoolName && (
            <Badge className="mb-3 border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold text-white">Portal Guru • {schoolName}</Badge>
          )}
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            Selamat datang{teacherName ? `, ${teacherName}` : ""}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-blue-100 sm:text-sm">
            Mengampu {subtitleCourses}. Kelola bahan ajar, buat ujian, dan pantau hasil murid di kelas Anda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => onNavigateTab?.("materi")} className="h-10 rounded-xl bg-white px-4 text-xs font-bold text-brand-700 shadow-md hover:bg-brand-50">
            <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
            Unggah bahan ajar
          </Button>
          <Button
            onClick={overview.reload}
            disabled={isLoading}
            variant="outline"
            className="h-10 rounded-xl border-white/20 bg-white/10 px-3 text-xs text-white hover:bg-white/20"
            aria-label="Muat ulang data"
          >
            <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {overview.error && (
        <Alert variant="danger" title="Dashboard gagal dimuat" action={<Button size="sm" variant="outline" onClick={overview.reload}>Coba lagi</Button>}>
          {overview.error}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ujian & kuis" value={data?.summary?.total_quizzes} icon={Award} tone="brand" isLoading={isLoading} hint="Ujian yang Anda buat" />
        <StatCard label="Bahan ajar" value={data?.summary?.total_materials} icon={BookOpen} tone="indigo" isLoading={isLoading} hint="Dokumen, audio, dan video" />
        <StatCard label="Murid dibimbing" value={data?.summary?.total_students_guided} icon={Users} tone="emerald" isLoading={isLoading} hint={`${classrooms.length} rombel ajar`} />
        <StatCard label="Rerata nilai ujian" value={data?.summary?.average_student_score} suffix="/ 100" icon={BarChart3} tone="amber" isLoading={isLoading} hint="Dari pengerjaan yang selesai" />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <School className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Rombel & mapel yang Anda ajar
            </h2>
            <p className="text-xs text-slate-500">Jadwal, ruang, dan murid sesuai plotting mapel dari admin sekolah.</p>
          </div>
          <Badge variant="secondary" className="self-start px-3 py-1 text-xs font-semibold sm:self-auto">
            {classrooms.length} kelas
          </Badge>
        </div>

        {!isLoading && classrooms.length === 0 ? (
          <EmptyState icon={School} title="Belum ada rombel ajar" description="Admin sekolah belum menugaskan kelas dan mapel untuk Anda." />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {classrooms.map((classroom) => (
              <TeacherClassCard
                key={classroom.id}
                classroom={classroom}
                subjects={(classroom.subject_assignments ?? []).filter((item) => item.teacher_id === teacherId)}
                students={studentsByClass.get(classroom.id) ?? []}
              />
            ))}
          </div>
        )}
      </section>

      <TeacherMaterialsPanel />

      <RecentEvaluationTable
        rows={data?.recent_submissions ?? []}
        isLoading={isLoading}
        onExportCSV={onExportCSV}
        title="Rekapitulasi nilai ujian siswa"
        subtitle="Pengerjaan ujian terbaru di kelas & mapel yang Anda ajar."
      />
    </div>
  );
}
