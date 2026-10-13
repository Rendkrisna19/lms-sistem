import { Lock, Send } from "lucide-react";
import { Dialog } from "../../ui/dialog";
import { Button } from "../../ui/button";

/** Peringatan saat siswa mencoba meninggalkan halaman ujian (tombol kembali, tautan, atau menutup tab). */
export function ExamLeaveDialog({ open, onStay }) {
  return (
    <Dialog
      open={open}
      onClose={onStay}
      size="sm"
      title="Anda tidak dapat meninggalkan ujian"
      description="Ujian sedang berlangsung. Tombol kembali dinonaktifkan selama ujian."
      footer={
        <Button onClick={onStay} data-autofocus>
          Kembali ke ujian
        </Button>
      }
    >
      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          Jawaban Anda tersimpan otomatis. Selesaikan dan kumpulkan ujian untuk mengakhiri sesi.
        </p>
      </div>
    </Dialog>
  );
}

/** Konfirmasi pengumpulan dengan ringkasan jawaban. */
export function ExamSubmitDialog({ open, onClose, onConfirm, answered, total, isLoading }) {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      dismissible={!isLoading}
      size="sm"
      title="Kumpulkan ujian sekarang?"
      description="Setelah dikumpulkan, jawaban tidak dapat diubah lagi."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Periksa lagi
          </Button>
          <Button variant="success" onClick={onConfirm} isLoading={isLoading} data-autofocus>
            <Send className="h-4 w-4" aria-hidden="true" />
            Ya, kumpulkan
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-brand-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">Terjawab</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-800 tabular-nums">
            {answered}
            <span className="text-sm font-semibold text-brand-600"> / {total}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Belum dijawab</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800 tabular-nums">{total - answered}</p>
        </div>
      </div>
    </Dialog>
  );
}
