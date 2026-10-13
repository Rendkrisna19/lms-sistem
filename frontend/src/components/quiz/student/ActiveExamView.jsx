import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useExamSession } from "../../../features/quiz/useExamSession";
import { useExamNavigationGuard } from "../../../features/quiz/useExamNavigationGuard";
import { setExamLock } from "../../../lib/examLock";
import { ExamHeader } from "./ExamHeader";
import { ExamQuestionCard } from "./ExamQuestionCard";
import { ExamFooter } from "./ExamFooter";
import { ExamProgress } from "./ExamProgress";
import { ExamLeaveDialog, ExamSubmitDialog } from "./ExamDialogs";

const RULES = [
  "Tidak dapat kembali ke soal sebelumnya, dan soal tidak dapat dilewati.",
  "Setiap pilihan tersimpan otomatis. Bila koneksi terputus, jawaban disimpan di perangkat.",
  "Ujian dikumpulkan otomatis saat waktu habis.",
];

/**
 * Sesi ujian yang sedang berlangsung. Selama tampil, navigasi aplikasi dikunci
 * dan tombol kembali browser diblokir. Siswa hanya dapat menjawab berurutan.
 */
export function ActiveExamView({ session, onFinished }) {
  const { answers, remaining, saveState, isSubmitting, selectAnswer, submit } = useExamSession(session, { onFinished });
  const questions = session.questions ?? [];

  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstOpen = questions.findIndex((question) => !answers[question.id]);
    return firstOpen === -1 ? Math.max(questions.length - 1, 0) : firstOpen;
  });
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const blocker = useExamNavigationGuard(true);

  useEffect(() => {
    setExamLock(true);
    return () => setExamLock(false);
  }, []);

  const current = questions[currentIndex];
  const answeredCount = questions.filter((question) => answers[question.id]).length;
  const unansweredCount = questions.length - answeredCount;
  const isAnswered = Boolean(current && answers[current.id]);
  const isLast = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (!isAnswered) return;
    setCurrentIndex((index) => index + 1);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitOpen(false);
    submit({ auto: false });
  };

  return (
    <div className="space-y-6">
      <ExamHeader
        course={session.quiz?.course?.title}
        title={session.quiz?.title}
        answered={answeredCount}
        total={questions.length}
        saveState={saveState}
        remaining={remaining}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {current ? (
            <ExamQuestionCard
              question={current}
              number={currentIndex + 1}
              total={questions.length}
              selectedOptionId={answers[current.id]}
              onSelect={(optionId) => selectAnswer(current.id, optionId)}
              disabled={isSubmitting}
            />
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Tidak ada soal yang tersedia untuk ujian ini.
            </p>
          )}

          <ExamFooter
            isLast={isLast}
            isAnswered={isAnswered}
            unansweredCount={unansweredCount}
            isSubmitting={isSubmitting}
            onNext={handleNext}
            onReviewSubmit={() => setIsSubmitOpen(true)}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <ExamProgress questions={questions} answers={answers} currentIndex={currentIndex} />
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Tata tertib ujian
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-600">
              {RULES.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ExamSubmitDialog
        open={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onConfirm={handleConfirmSubmit}
        answered={answeredCount}
        total={questions.length}
        isLoading={isSubmitting}
      />
      <ExamLeaveDialog open={blocker.state === "blocked"} onStay={() => blocker.reset?.()} />
    </div>
  );
}
