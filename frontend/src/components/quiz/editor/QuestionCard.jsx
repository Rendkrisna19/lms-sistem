import { memo, useCallback, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, ChevronDown, Copy, ImageIcon, Lightbulb, Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "../../editor/RichTextEditor";
import { OptionItem } from "./OptionItem";
import { ImageAttachment } from "./ImageAttachment";
import { FieldError } from "../../ui/field";
import { Button } from "../../ui/button";
import { MAX_OPTIONS, MIN_OPTIONS, optionKey, optionLabel, questionKey } from "../../../features/quiz/editorModel";
import { htmlToPlainText, isHtmlBlank } from "../../../lib/sanitize";
import { cn } from "../../../lib/utils";

function IconAction({ label, icon: Icon, onClick, disabled, tone = "default" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
        tone === "danger" ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/**
 * Kartu satu butir soal. Saat diciutkan hanya menampilkan ringkasan
 * (editor tidak dirender) agar halaman tetap ringan untuk ujian dengan banyak soal.
 */
export const QuestionCard = memo(function QuestionCard({
  question,
  index,
  total,
  errors,
  status,
  isExpanded,
  onToggleExpand,
  actions,
  onRequestRemove,
  onDuplicate,
  onUploadImage,
}) {
  const number = index + 1;
  const uid = question.uid;
  const [showExplanation, setShowExplanation] = useState(() => !isHtmlBlank(question.explanation));
  const correctIndex = question.options.findIndex((option) => option.is_correct);
  const textError = errors[questionKey(uid, "question_text")];
  const optionsError = errors[questionKey(uid, "options")];
  const pointsError = errors[questionKey(uid, "points")];

  const handleOptionChange = useCallback((optionUid, patch) => actions.updateOption(uid, optionUid, patch), [actions, uid]);
  const handleSetCorrect = useCallback((optionUid) => actions.setCorrect(uid, optionUid), [actions, uid]);
  const handleRemoveOption = useCallback((optionUid) => actions.removeOption(uid, optionUid), [actions, uid]);

  const StatusIcon = status === "error" ? AlertCircle : status === "complete" ? CheckCircle2 : null;

  return (
    <article
      id={`question-${uid}`}
      aria-label={`Soal nomor ${number}`}
      className={cn(
        "rounded-2xl border bg-white shadow-xs scroll-mt-28 transition-colors",
        status === "error" ? "border-red-300" : isExpanded ? "border-brand-200 ring-1 ring-brand-100" : "border-slate-200/80"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => onToggleExpand(uid)}
          aria-expanded={isExpanded}
          aria-controls={`question-body-${uid}`}
          className="flex flex-1 min-w-0 items-center gap-3 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span
            className={cn(
              "h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-bold",
              status === "error" ? "bg-red-100 text-red-700" : status === "complete" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {number}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              Soal {number}
              {StatusIcon && (
                <StatusIcon
                  className={cn("h-4 w-4", status === "error" ? "text-red-500" : "text-emerald-500")}
                  aria-label={status === "error" ? "Perlu diperbaiki" : "Lengkap"}
                />
              )}
            </span>
            {!isExpanded && (
              <span className="block text-xs text-slate-500 truncate mt-0.5">
                {htmlToPlainText(question.question_text, 140) || <em>Belum ada teks soal</em>}
              </span>
            )}
          </span>
          {!isExpanded && (
            <span className="hidden md:flex items-center gap-3 text-xs text-slate-500 shrink-0">
              <span>{question.options.length} pilihan</span>
              <span className={correctIndex >= 0 ? "text-emerald-700 font-semibold" : "text-amber-600"}>
                Kunci: {correctIndex >= 0 ? optionLabel(correctIndex) : "–"}
              </span>
              <span className="font-semibold text-slate-700">{question.points} poin</span>
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", isExpanded && "rotate-180")} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-0.5 shrink-0 border-l border-slate-100 pl-2">
          <IconAction label={`Pindahkan soal ${number} ke atas`} icon={ArrowUp} onClick={() => actions.moveQuestion(uid, -1)} disabled={index === 0} />
          <IconAction label={`Pindahkan soal ${number} ke bawah`} icon={ArrowDown} onClick={() => actions.moveQuestion(uid, 1)} disabled={index === total - 1} />
          <IconAction label={`Duplikat soal ${number}`} icon={Copy} onClick={() => onDuplicate(uid)} />
          <IconAction label={`Hapus soal ${number}`} icon={Trash2} onClick={() => onRequestRemove(question, number)} disabled={total <= 1} tone="danger" />
        </div>
      </div>

      {/* Isi */}
      {isExpanded && (
        <div id={`question-body-${uid}`} className="border-t border-slate-100 px-4 pb-5 pt-4 space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="space-y-1.5 min-w-0">
              <label htmlFor={`question-text-${uid}`} className="block text-[13px] font-semibold text-slate-700">
                Pertanyaan<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <RichTextEditor
                id={`question-text-${uid}`}
                value={question.question_text}
                onChange={(html) => actions.updateQuestion(uid, { question_text: html })}
                onUploadImage={onUploadImage}
                placeholder="Tulis pertanyaan… Anda bisa menyisipkan gambar, tabel kode, rumus (x², H₂O), atau tempel gambar langsung."
                ariaDescribedBy={textError ? `question-text-error-${uid}` : undefined}
                invalid={!!textError}
              />
              <FieldError id={`question-text-error-${uid}`}>{textError}</FieldError>
            </div>
            <div className="space-y-1.5 lg:w-28">
              <label htmlFor={`question-points-${uid}`} className="block text-[13px] font-semibold text-slate-700">
                Bobot
              </label>
              <div className="relative">
                <input
                  id={`question-points-${uid}`}
                  type="number"
                  min={1}
                  max={1000}
                  value={question.points}
                  onChange={(event) => actions.updateQuestion(uid, { points: event.target.value })}
                  aria-invalid={!!pointsError || undefined}
                  className={cn(
                    "h-10 w-full rounded-xl border bg-white pl-3 pr-11 text-sm font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    pointsError ? "border-red-400" : "border-slate-300"
                  )}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">poin</span>
              </div>
              <FieldError>{pointsError}</FieldError>
            </div>
          </div>

          {/* Gambar lama (kolom image_url) tetap ditampilkan agar bisa dihapus */}
          {question.image_url && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                <ImageIcon className="h-4 w-4 text-brand-600" aria-hidden="true" /> Gambar soal
              </p>
              <ImageAttachment
                url={question.image_url}
                onChange={(url) => actions.updateQuestion(uid, { image_url: url })}
                onUpload={onUploadImage}
                label={`gambar soal ${number}`}
              />
            </div>
          )}

          {/* Pilihan jawaban */}
          <fieldset className="space-y-2.5" aria-describedby={optionsError ? `options-error-${uid}` : undefined}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-[13px] font-semibold text-slate-700">
                Pilihan jawaban<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                <span className="ml-2 font-normal text-xs text-slate-500">Klik huruf untuk menandai kunci jawaban.</span>
              </legend>
              <span className="text-xs text-slate-400">
                {question.options.length}/{MAX_OPTIONS} pilihan
              </span>
            </div>
            <FieldError id={`options-error-${uid}`}>{optionsError}</FieldError>

            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <OptionItem
                  key={option.uid}
                  option={option}
                  index={optIndex}
                  questionUid={uid}
                  questionNumber={number}
                  error={errors[optionKey(option.uid, "option_text")]}
                  canRemove={question.options.length > MIN_OPTIONS}
                  onSetCorrect={handleSetCorrect}
                  onChange={handleOptionChange}
                  onRemove={handleRemoveOption}
                  onUploadImage={onUploadImage}
                />
              ))}
            </div>

            {question.options.length < MAX_OPTIONS && (
              <Button type="button" variant="ghost" size="sm" onClick={() => actions.addOption(uid)} className="text-brand-700 hover:bg-brand-50">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Tambah pilihan {optionLabel(question.options.length)}
              </Button>
            )}
          </fieldset>

          {/* Pembahasan */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40">
            <button
              type="button"
              onClick={() => setShowExplanation((open) => !open)}
              aria-expanded={showExplanation}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-amber-900"
            >
              <span className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
                Pembahasan <span className="font-normal text-amber-700/80">(opsional, hanya terlihat oleh guru)</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showExplanation && "rotate-180")} aria-hidden="true" />
            </button>
            {showExplanation && (
              <div className="px-3.5 pb-3.5">
                <RichTextEditor
                  value={question.explanation}
                  onChange={(html) => actions.updateQuestion(uid, { explanation: html })}
                  onUploadImage={onUploadImage}
                  placeholder="Jelaskan mengapa jawaban tersebut benar…"
                  ariaLabel={`Pembahasan soal ${number}`}
                  contentClassName="min-h-[90px]"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
});
