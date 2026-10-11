import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ImageIcon,
  School,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Check,
  FileQuestion
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function QuizDetailModal({ isOpen, onClose, quiz }) {
  if (!isOpen || !quiz) return null;

  const isInactive = !quiz.is_active;
  const isUpcoming = quiz.starts_at && new Date(quiz.starts_at) > new Date();
  const isClosed = quiz.ends_at && new Date(quiz.ends_at) < new Date();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 my-8 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full p-1.5 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="pb-5 border-b border-slate-100 shrink-0 pr-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className={`text-[11px] font-bold px-2.5 py-0.5 ${
                isInactive
                  ? "bg-slate-100 text-slate-600 border-slate-200"
                  : isClosed
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : isUpcoming
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isInactive
                ? "Status: Nonaktif / Draf"
                : isClosed
                ? "Status: Ujian Ditutup"
                : isUpcoming
                ? "Status: Terjadwal (Akan Datang)"
                : "Status: Aktif Berjalan"}
            </Badge>

            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold">
              {quiz.classroom?.name} ({quiz.classroom?.code})
            </Badge>

            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px] font-semibold">
              {quiz.course?.title}
            </Badge>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
            {quiz.title}
          </h2>

          {quiz.instructions && (
            <p className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
              {quiz.instructions}
            </p>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Durasi</span>
                <span className="font-bold text-slate-800">{quiz.duration_minutes} Menit</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nilai KKM</span>
                <span className="font-bold text-slate-800">{quiz.passing_score} / 100</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Jadwal Buka</span>
                <span className="font-bold text-slate-800">
                  {quiz.starts_at
                    ? new Date(quiz.starts_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Fleksibel"}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Jadwal Tutup</span>
                <span className="font-bold text-slate-800">
                  {quiz.ends_at
                    ? new Date(quiz.ends_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Tanpa Batas"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Questions Roster (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileQuestion className="h-4 w-4 text-blue-600" />
              <span>Daftar Butir Soal & Kunci Jawaban</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Total: <strong className="text-slate-700">{quiz.questions?.length || 0} Soal</strong>
            </span>
          </div>

          {(!quiz.questions || quiz.questions.length === 0) ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Belum ada butir soal yang dibuat untuk ujian ini.
            </div>
          ) : (
            quiz.questions.map((question, qIdx) => (
              <div
                key={question.id || qIdx}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition-colors shadow-2xs space-y-4"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Soal Nomor {qIdx + 1}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-mono">
                    Bobot: {question.points || 10} Poin
                  </Badge>
                </div>

                {/* Question Text (Supports Rich HTML formatting) */}
                <div
                  className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: question.question_text }}
                />

                {/* Question Image if available */}
                {question.image_url && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 max-w-lg">
                    <img
                      src={question.image_url}
                      alt={`Gambar Soal ${qIdx + 1}`}
                      className="w-full h-auto max-h-72 object-contain"
                    />
                  </div>
                )}

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {question.options?.map((opt, optIdx) => (
                    <div
                      key={opt.id || optIdx}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        opt.is_correct
                          ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20 text-emerald-950 shadow-xs"
                          : "bg-slate-50/60 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            opt.is_correct
                              ? "bg-emerald-600 text-white"
                              : "bg-white border border-slate-200 text-slate-700"
                          }`}
                        >
                          {opt.option_label}
                        </span>

                        <div className="flex-1 min-w-0">
                          {opt.option_text && (
                            <span className="text-xs font-medium block">
                              {opt.option_text}
                            </span>
                          )}

                          {/* Option Image if available */}
                          {opt.image_url && (
                            <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden bg-white max-w-[200px]">
                              <img
                                src={opt.image_url}
                                alt={`Opsi ${opt.option_label}`}
                                className="w-full h-auto max-h-28 object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {opt.is_correct && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-2 pl-8">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                          <span>Kunci Jawaban Benar</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Explanation if available */}
                {question.explanation && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                    <strong className="block text-blue-700 mb-0.5">Pembahasan Soal:</strong>
                    {question.explanation}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs px-5 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
