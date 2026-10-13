import { ArrowRight, Send } from "lucide-react";
import { Button } from "../../ui/button";

/** Tombol aksi di bawah soal. "Soal berikutnya" hanya aktif setelah soal dijawab. */
export function ExamFooter({ isLast, isAnswered, unansweredCount, isSubmitting, onNext, onReviewSubmit }) {
  if (!isLast) {
    return (
      <footer className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {isAnswered ? "Jawaban tersimpan. Lanjutkan ke soal berikutnya." : "Pilih satu jawaban untuk melanjutkan."}
        </p>
        <Button size="lg" onClick={onNext} disabled={!isAnswered || isSubmitting} className="w-full sm:w-auto">
          Soal berikutnya
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </footer>
    );
  }

  const allAnswered = unansweredCount === 0;

  return (
    <footer className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className={allAnswered ? "text-xs text-slate-500" : "text-xs font-semibold text-amber-700"}>
        {allAnswered ? "Semua soal sudah dijawab. Periksa kembali sebelum mengumpulkan." : `Masih ada ${unansweredCount} soal yang belum dijawab.`}
      </p>
      <Button size="lg" variant="success" onClick={onReviewSubmit} disabled={!allAnswered || isSubmitting} className="w-full sm:w-auto">
        <Send className="h-4 w-4" aria-hidden="true" />
        Kumpulkan ujian
      </Button>
    </footer>
  );
}
