import { CalendarClock, Clock, FileQuestion, PlayCircle, ShieldCheck, Target } from "lucide-react";
import { Button } from "../../ui/button";
import { Alert } from "../../ui/alert";
import { formatDateTime, formatMinutes } from "../../../lib/datetime";

const RULES = [
  "Timer mulai berjalan saat Anda menekan tombol Mulai dan tidak berhenti walau halaman ditutup.",
  "Setiap jawaban tersimpan otomatis. Bila koneksi terputus, jawaban disimpan di perangkat lalu dikirim ulang.",
  "Ujian hanya dapat dikerjakan satu kali dan dikumpulkan otomatis saat waktu habis.",
];

export function ExamIntro({ quiz, isResuming, isStarting, onStart, blockedReason }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-brand-500 px-6 sm:px-8 py-7 text-white">
          <p className="text-xs font-medium text-blue-100">{quiz.course?.title}</p>
          <h1 className="mt-1 text-xl sm:text-2xl font-bold leading-snug">{quiz.title}</h1>
          {quiz.teacher?.name && <p className="mt-1 text-sm text-blue-100">{quiz.teacher.name}</p>}
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-6">
          <dl className="grid grid-cols-3 gap-3">
            {[
              { icon: Clock, label: "Durasi", value: formatMinutes(quiz.duration_minutes) },
              { icon: FileQuestion, label: "Jumlah soal", value: `${quiz.total_questions} soal` },
              { icon: Target, label: "KKM", value: quiz.passing_score },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center">
                <Icon className="mx-auto h-5 w-5 text-brand-600" aria-hidden="true" />
                <dt className="mt-1 text-[11px] text-slate-500">{label}</dt>
                <dd className="text-sm font-bold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          {quiz.ends_at && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Ujian ditutup {formatDateTime(quiz.ends_at)}
            </p>
          )}

          {quiz.instructions && (
            <div>
              <h2 className="text-sm font-bold text-slate-900">Petunjuk dari guru</h2>
              <p className="mt-1.5 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{quiz.instructions}</p>
            </div>
          )}

          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-brand-900">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Tata tertib
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>

          {blockedReason ? (
            <Alert variant="warning">{blockedReason}</Alert>
          ) : (
            <Button size="lg" className="w-full" onClick={onStart} isLoading={isStarting}>
              {!isStarting && <PlayCircle className="h-5 w-5" aria-hidden="true" />}
              {isResuming ? "Lanjutkan Ujian" : "Mulai Ujian Sekarang"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
