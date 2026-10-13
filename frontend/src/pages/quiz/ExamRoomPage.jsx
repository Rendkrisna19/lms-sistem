import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { quizApi } from "../../features/quiz/api";
import { getErrorMessage } from "../../lib/api";
import { startBlockedReason } from "../../features/quiz/examStatus";
import { Alert } from "../../components/ui/alert";
import { ExamIntro } from "../../components/quiz/student/ExamIntro";
import { ActiveExamView } from "../../components/quiz/student/ActiveExamView";
import { ExamResult } from "../../components/quiz/student/ExamResult";

/**
 * Ruang ujian siswa. Tahapan: memuat status -> pengantar -> ujian berjalan -> hasil.
 * Ujian ulang (remedial) tampil sebagai pengantar lagi bila guru membuka aksesnya.
 */
export function ExamRoomPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState({ phase: "loading" });
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      setView({ phase: "loading" });
      try {
        const { quizzes } = await quizApi.studentList();
        if (!active) return;

        const quiz = quizzes?.find((item) => String(item.id) === String(quizId));
        if (!quiz) {
          setView({ phase: "error", message: "Ujian tidak ditemukan untuk kelas Anda." });
          return;
        }

        if (quiz.attempt?.status === "in_progress") {
          // Sesi yang belum selesai (mis. setelah refresh) dilanjutkan dari server
          const session = await quizApi.start(quizId);
          if (active) setView({ phase: "active", session });
          return;
        }

        if (quiz.attempt && !quiz.can_start) {
          setView({ phase: "result", title: quiz.title, attempt: quiz.attempt });
          return;
        }

        setView({ phase: "intro", quiz });
      } catch (err) {
        if (active) setView({ phase: "error", message: getErrorMessage(err, "Gagal memuat status ujian.") });
      }
    }

    loadStatus();
    return () => {
      active = false;
    };
  }, [quizId]);

  const handleStart = async (quiz) => {
    setIsStarting(true);
    try {
      const session = await quizApi.start(quizId);
      setView({ phase: "active", session });
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.status === "already_finished") {
        toast.info("Ujian ini sudah pernah Anda kumpulkan.");
        setView({ phase: "result", title: quiz.title, attempt: err.response.data.data?.attempt });
      } else {
        toast.error(getErrorMessage(err, "Gagal memulai sesi ujian."));
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinished = (session, finalAttempt) => {
    if (finalAttempt) {
      setView({ phase: "result", title: session.quiz?.title, attempt: finalAttempt });
      return;
    }
    // Server menutup ujian tanpa menyertakan hasil: ambil hasilnya langsung
    quizApi
      .result(session.attempt.id)
      .then((data) => setView({ phase: "result", title: session.quiz?.title, attempt: data.attempt }))
      .catch(() => navigate("/ujian", { replace: true }));
  };

  if (view.phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden="true" />
        <p className="text-sm font-medium">Memuat ruang ujian…</p>
      </div>
    );
  }

  if (view.phase === "error") {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12">
        <Alert variant="danger" title="Ruang ujian tidak dapat dibuka">
          {view.message}
        </Alert>
        <BackToList />
      </div>
    );
  }

  if (view.phase === "result") {
    return <ExamResult quizTitle={view.title} attempt={view.attempt} />;
  }

  if (view.phase === "active") {
    return (
      <ActiveExamView
        session={view.session}
        onFinished={(finalAttempt) => handleFinished(view.session, finalAttempt)}
      />
    );
  }

  const { quiz } = view;
  const blockedReason = startBlockedReason(quiz);

  return (
    <div className="space-y-5">
      <BackToList />
      <ExamIntro
        quiz={quiz}
        isRetake={Boolean(quiz.attempt)}
        attemptNo={quiz.attempt ? quiz.attempt.attempt_no + 1 : 1}
        isStarting={isStarting}
        blockedReason={blockedReason}
        onStart={() => handleStart(quiz)}
      />
    </div>
  );
}

function BackToList() {
  return (
    <Link to="/ujian" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Kembali ke daftar ujian
    </Link>
  );
}
