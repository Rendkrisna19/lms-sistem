import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, CalendarClock, Clock, Download, FileQuestion, Pencil, Power, RefreshCw, School, Target, Users } from "lucide-react";
import { toast } from "sonner";
import { quizApi } from "../../features/quiz/api";
import { getErrorMessage, isCanceled } from "../../lib/api";
import { formatDateTime } from "../../lib/datetime";
import { Button, buttonVariants } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { QuizStatusBadge } from "../../components/quiz/QuizStatusBadge";
import { GradesPanel } from "../../components/quiz/detail/GradesPanel";
import { ItemAnalysisPanel } from "../../components/quiz/detail/ItemAnalysisPanel";
import { QuestionsPreview } from "../../components/quiz/detail/QuestionsPreview";

function Meta({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
      <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
      {children}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-40" />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export function QuizDetailPage() {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [grades, setGrades] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [retakeBusyId, setRetakeBusyId] = useState(null);
  const [tab, setTab] = useState("grades");
  const [isToggling, setIsToggling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };
    setIsLoading(true);
    setError(null);
    Promise.all([quizApi.detail(quizId, config), quizApi.grades(quizId, config)])
      .then(([detail, gradeData]) => {
        setQuiz(detail);
        setGrades(gradeData);
      })
      .catch((err) => {
        if (isCanceled(err)) return;
        setError(err.response?.status === 404 ? "Ujian tidak ditemukan atau bukan milik Anda." : getErrorMessage(err, "Gagal memuat detail ujian."));
      })
      .finally(() => !controller.signal.aborted && setIsLoading(false));
    return () => controller.abort();
  }, [quizId, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const res = await quizApi.toggleStatus(quiz.id);
      setQuiz((prev) => ({ ...prev, ...res.data }));
      toast.success(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengubah status ujian."));
    } finally {
      setIsToggling(false);
    }
  };

  /** Buka atau cabut akses ujian ulang untuk satu siswa remedial. */
  const handleRetake = async (row, action) => {
    setRetakeBusyId(row.student_id);
    try {
      const request = action === "grant" ? quizApi.grantRetake : quizApi.revokeRetake;
      const res = await request(quiz.id, row.student_id);
      toast.success(res.message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengubah akses ujian ulang."));
    } finally {
      setRetakeBusyId(null);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await quizApi.exportCsv(quiz.id, quiz.title);
      toast.success("Rekap nilai berhasil diunduh.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengunduh rekap nilai."));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !quiz) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="max-w-2xl space-y-4">
        <Link to="/ujian" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke daftar ujian
        </Link>
        <Alert variant="danger" title="Detail ujian tidak dapat dimuat" action={<Button size="sm" variant="outline" onClick={reload}>Coba lagi</Button>}>
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/ujian" className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2" })}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Daftar ujian
      </Link>

      <header className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <QuizStatusBadge status={quiz.status_state} />
              {!quiz.show_result_immediately && (
                <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5">Nilai disembunyikan dari siswa</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{quiz.title}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Meta icon={School}>
                {quiz.classroom?.name} ({quiz.classroom?.code}) — {quiz.course?.title}
              </Meta>
              <Meta icon={FileQuestion}>
                {quiz.questions.length} soal • {quiz.total_points} poin
              </Meta>
              <Meta icon={Clock}>{quiz.duration_minutes} menit</Meta>
              <Meta icon={Target}>KKM {quiz.passing_score}</Meta>
              {(quiz.starts_at || quiz.ends_at) && (
                <Meta icon={CalendarClock}>
                  {quiz.starts_at ? formatDateTime(quiz.starts_at) : "Sekarang"} – {quiz.ends_at ? formatDateTime(quiz.ends_at) : "tanpa batas"}
                </Meta>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" onClick={reload} disabled={isLoading} aria-label="Segarkan data">
              <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            </Button>
            <Button variant="outline" onClick={handleToggle} isLoading={isToggling}>
              {!isToggling && <Power className="h-4 w-4" aria-hidden="true" />}
              {quiz.is_active ? "Nonaktifkan" : "Aktifkan"}
            </Button>
            <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
              {!isExporting && <Download className="h-4 w-4" aria-hidden="true" />}
              Ekspor CSV
            </Button>
            <Link to={`/ujian/${quiz.id}/edit`} className={buttonVariants()}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Ujian
            </Link>
          </div>
        </div>
        {quiz.instructions && <p className="mt-4 text-sm text-slate-600 whitespace-pre-line border-t border-slate-100 pt-4">{quiz.instructions}</p>}
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Bagian detail ujian">
          <TabsTrigger value="grades">
            <Users className="h-3.5 w-3.5" aria-hidden="true" /> Rekap Nilai
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" /> Analisis Butir Soal
          </TabsTrigger>
          <TabsTrigger value="questions">
            <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" /> Pratinjau Soal
          </TabsTrigger>
        </TabsList>
        <TabsContent value="grades">
          {grades && (
            <GradesPanel
              grades={grades}
              busyStudentId={retakeBusyId}
              onGrantRetake={(row) => handleRetake(row, "grant")}
              onRevokeRetake={(row) => handleRetake(row, "revoke")}
            />
          )}
        </TabsContent>
        <TabsContent value="analysis">
          {grades && <ItemAnalysisPanel items={grades.item_analysis} finishedCount={grades.summary.finished} />}
        </TabsContent>
        <TabsContent value="questions">
          <QuestionsPreview questions={quiz.questions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
