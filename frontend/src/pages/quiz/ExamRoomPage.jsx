import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Loader2,
  AlertTriangle,
  Menu,
  X
} from "lucide-react";
import { toast } from "sonner";
import { quizApi } from "../../features/quiz/api";
import { useExamSession } from "../../features/quiz/useExamSession";
import { getErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { ExamIntro } from "../../components/quiz/student/ExamIntro";
import { ExamQuestionView } from "../../components/quiz/student/ExamQuestionView";
import { QuestionPalette } from "../../components/quiz/student/QuestionPalette";
import { ExamTimer } from "../../components/quiz/student/ExamTimer";
import { SaveIndicator } from "../../components/quiz/student/SaveIndicator";
import { ExamResult } from "../../components/quiz/student/ExamResult";

/** Subkomponen ruang aktif saat sesi ujian sedang berlangsung */
function ActiveExamView({ session, onFinished }) {
  const {
    answers,
    flags,
    remaining,
    saveState,
    isSubmitting,
    selectAnswer,
    toggleFlag,
    submit,
  } = useExamSession(session, { onFinished });

  const questions = session.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const isFlagged = currentQuestion ? !!flags[currentQuestion.id] : false;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsConfirmOpen(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/95 px-5 py-3.5 shadow-xs backdrop-blur-xs">
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            {session.quiz?.course?.title ?? "Ujian Online"}
          </span>
          <h1 className="text-base font-bold text-slate-900 truncate">
            {session.quiz?.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SaveIndicator status={saveState.status} savedAt={saveState.savedAt} />
          <ExamTimer seconds={remaining} />

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isSubmitting}
            className="hidden sm:inline-flex rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            <Send className="h-4 w-4 mr-1.5" />
            Kumpulkan
          </Button>

          {/* Mobile Drawer Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="sm:hidden rounded-xl border-slate-200 cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Grid: Question Content & Palette Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question & Bottom Actions */}
        <div className="lg:col-span-8 space-y-4">
          {currentQuestion ? (
            <ExamQuestionView
              question={currentQuestion}
              number={currentIndex + 1}
              total={questions.length}
              selectedOptionId={answers[currentQuestion.id]}
              onSelect={(optionId) => selectAnswer(currentQuestion.id, optionId)}
              disabled={isSubmitting}
            />
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              Tidak ada soal yang tersedia.
            </div>
          )}

          {/* Action Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0 || isSubmitting}
              className="rounded-xl border-slate-200 cursor-pointer text-xs"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>

            {currentQuestion && (
              <Button
                type="button"
                variant={isFlagged ? "secondary" : "outline"}
                onClick={() => toggleFlag(currentQuestion.id)}
                disabled={isSubmitting}
                className={`rounded-xl text-xs cursor-pointer ${
                  isFlagged
                    ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Flag className={`h-4 w-4 mr-1.5 ${isFlagged ? "fill-amber-600 text-amber-600" : ""}`} />
                {isFlagged ? "Ragu-ragu (Ditandai)" : "Tandai Ragu-ragu"}
              </Button>
            )}

            {currentIndex === questions.length - 1 ? (
              <Button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer text-xs"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Kumpulkan Jawaban
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer text-xs"
              >
                Berikutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Palette & Progress (Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
          <QuestionPalette
            questions={questions}
            answers={answers}
            flags={flags}
            currentIndex={currentIndex}
            onSelect={(idx) => setCurrentIndex(idx)}
          />

          <Button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
          >
            <Send className="h-4 w-4 mr-2" />
            Kumpulkan Ujian Sekarang
          </Button>
        </aside>
      </div>

      {/* Mobile Drawer for Question Palette */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-xs lg:hidden">
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-5 overflow-y-auto space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800">Daftar Nomor Soal</h2>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <QuestionPalette
              questions={questions}
              answers={answers}
              flags={flags}
              currentIndex={currentIndex}
              onSelect={(idx) => {
                setCurrentIndex(idx);
                setIsMobileDrawerOpen(false);
              }}
            />

            <Button
              type="button"
              onClick={() => {
                setIsMobileDrawerOpen(false);
                setIsConfirmOpen(true);
              }}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              <Send className="h-4 w-4 mr-2" />
              Kumpulkan Ujian
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog on Submit */}
      <ConfirmDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          submit({ auto: false });
        }}
        isLoading={isSubmitting}
        title="Kumpulkan Ujian?"
        confirmLabel="Ya, Kumpulkan Jawaban"
        cancelLabel="Kembali Memeriksa"
        tone={unansweredCount > 0 ? "danger" : "default"}
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Pastikan Anda telah memeriksa kembali seluruh jawaban sebelum mengumpulkan ujian ini.
          </p>
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[11px]">Soal Terjawab:</span>
              <strong className="text-emerald-600 text-sm">{answeredCount} dari {questions.length}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Belum Dijawab:</span>
              <strong className={`text-sm ${unansweredCount > 0 ? "text-amber-600" : "text-slate-700"}`}>
                {unansweredCount} soal
              </strong>
            </div>
          </div>
          {unansweredCount > 0 && (
            <p className="text-amber-700 font-medium">
              Perhatian: Masih ada {unansweredCount} soal yang belum Anda isi. Jawaban kosong akan dinilai salah.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </div>
  );
}

/** Halaman Ruang Ujian Utama Siswa */
export function ExamRoomPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizMetadata, setQuizMetadata] = useState(null);
  const [session, setSession] = useState(null);
  const [finishedAttempt, setFinishedAttempt] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

  // Load quiz metadata and check if attempt is already running or finished
  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await quizApi.studentList();
        if (!mounted) return;

        const currentQuiz = res.quizzes?.find((q) => String(q.id) === String(quizId));
        if (!currentQuiz) {
          setError("Ujian tidak ditemukan untuk kelas Anda.");
          setIsLoading(false);
          return;
        }

        setQuizMetadata(currentQuiz);

        // If attempt is already finished, show result immediately
        if (currentQuiz.attempt && currentQuiz.attempt.status !== "in_progress") {
          setFinishedAttempt(currentQuiz.attempt);
          setIsLoading(false);
          return;
        }

        // If attempt is already in_progress, automatically resume session
        if (currentQuiz.attempt?.status === "in_progress") {
          const sessData = await quizApi.start(quizId);
          if (mounted) {
            setSession(sessData);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(getErrorMessage(err, "Gagal memuat status ujian."));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkStatus();

    return () => {
      mounted = false;
    };
  }, [quizId]);

  // Start exam from Intro screen
  const handleStartExam = async () => {
    setIsStarting(true);
    try {
      const sessData = await quizApi.start(quizId);
      setSession(sessData);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.status === "already_finished") {
        setFinishedAttempt(err.response.data.data?.attempt);
        toast.info("Ujian ini sudah pernah Anda kumpulkan.");
      } else {
        toast.error(getErrorMessage(err, "Gagal memulai sesi ujian."));
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium">Memuat ruang ujian online...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-12 space-y-4">
        <Alert variant="destructive">{error}</Alert>
        <div className="text-center">
          <Link
            to="/ujian"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Ujian
          </Link>
        </div>
      </div>
    );
  }

  // 1. Result screen when exam is completed
  if (finishedAttempt) {
    return (
      <ExamResult
        quizTitle={quizMetadata?.title || "Hasil Ujian Online"}
        attempt={finishedAttempt}
      />
    );
  }

  // 2. Active exam session
  if (session) {
    return (
      <ActiveExamView
        session={session}
        onFinished={(finalAttempt) => {
          setSession(null);
          setFinishedAttempt(finalAttempt);
        }}
      />
    );
  }

  // 3. Intro screen before starting
  if (quizMetadata) {
    return (
      <div className="space-y-4 py-4">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/ujian"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Ujian
          </Link>
        </div>

        <ExamIntro
          quiz={quizMetadata}
          isResuming={false}
          isStarting={isStarting}
          onStart={handleStartExam}
          blockedReason={!quizMetadata.can_start ? "Ujian saat ini belum dapat dimulai." : null}
        />
      </div>
    );
  }

  return null;
}
