import { Clock, FileQuestion, RotateCcw, Target } from "lucide-react";
import { Button } from "../../ui/button";
import { Alert } from "../../ui/alert";
import { formatDateTime, formatMinutes } from "../../../lib/datetime";

const RULES = [
  "Timer mulai saat tombol mulai ditekan dan terus berjalan walau halaman ditutup.",
  "Soal dikerjakan berurutan. Setiap soal wajib dijawab sebelum lanjut dan tidak dapat diulang.",
  "Jawaban tersimpan otomatis. Bila koneksi terputus, jawaban disimpan di perangkat lalu dikirim ulang.",
  "Navigasi aplikasi dikunci selama ujian. Kumpulkan ujian untuk mengakhiri sesi.",
];

/** Pengantar ujian: informasi ujian di kolom utama, dan ringkasan serta tombol mulai di kolom samping. */
export function ExamIntro({ quiz, isRetake, attemptNo, isStarting, blockedReason, onStart }) {
  const facts = [
    { icon: Clock, label: "Durasi", value: formatMinutes(quiz.duration_minutes) },
    { icon: FileQuestion, label: "Jumlah soal", value: `${quiz.total_questions} soal` },
    { icon: Target, label: "KKM", value: `${quiz.passing_score}` },
  ];

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <article className="min-w-0 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{quiz.course?.title ?? "Ujian Online"}</p>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{quiz.title}</h1>
          {quiz.teacher?.name && <p className="text-sm text-slate-500">Pengampu {quiz.teacher.name}</p>}
          {isRetake && (
            <p className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Ujian ulang, percobaan ke-{attemptNo}
            </p>
          )}
        </header>

        {isRetake && (
          <Alert variant="info" title="Guru membuka kesempatan ujian ulang">
            Nilai sebelumnya belum mencapai KKM. Nilai percobaan ini yang akan tercatat.
          </Alert>
        )}

        <dl className="grid grid-cols-1 divide-y divide-slate-100 border-y border-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-4 sm:px-5 sm:first:pl-0">
              <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="text-base font-semibold text-slate-900">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        {quiz.instructions && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">Petunjuk dari guru</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{quiz.instructions}</p>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Tata tertib</h2>
          <ol className="space-y-2.5 text-sm leading-relaxed text-slate-700">
            {RULES.map((rule, index) => (
              <li key={rule} className="flex gap-3">
                <span className="w-5 shrink-0 font-semibold tabular-nums text-slate-400">{index + 1}.</span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </section>
      </article>

      <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 xl:sticky xl:top-28">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">Siap memulai?</h2>
          <p className="text-xs text-slate-500">Pastikan koneksi stabil dan Anda tidak sedang membuka tab lain.</p>
        </div>

        <dl className="space-y-2.5 text-sm">
          {quiz.starts_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Dibuka</dt>
              <dd className="text-right font-medium text-slate-800">{formatDateTime(quiz.starts_at)}</dd>
            </div>
          )}
          {quiz.ends_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ditutup</dt>
              <dd className="text-right font-medium text-slate-800">{formatDateTime(quiz.ends_at)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Batas pengerjaan</dt>
            <dd className="font-medium text-slate-800">{formatMinutes(quiz.duration_minutes)}</dd>
          </div>
        </dl>

        {blockedReason ? (
          <Alert variant="warning">{blockedReason}</Alert>
        ) : (
          <Button size="lg" className="h-11 w-full" onClick={onStart} isLoading={isStarting}>
            {isRetake ? "Mulai ujian ulang" : "Mulai ujian"}
          </Button>
        )}
      </aside>
    </div>
  );
}
