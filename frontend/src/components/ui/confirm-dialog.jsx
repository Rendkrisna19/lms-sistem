import { AlertTriangle, HelpCircle, Loader2 } from "lucide-react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { cn } from "../../lib/utils";

/**
 * Dialog konfirmasi untuk aksi penting (hapus, kumpulkan ujian, keluar tanpa menyimpan).
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  tone = "danger",
  isLoading = false,
}) {
  const Icon = tone === "danger" ? AlertTriangle : HelpCircle;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      dismissible={!isLoading}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            data-autofocus
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center",
            tone === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500 leading-relaxed">{description}</p>}
          {children}
        </div>
      </div>
    </Dialog>
  );
}
