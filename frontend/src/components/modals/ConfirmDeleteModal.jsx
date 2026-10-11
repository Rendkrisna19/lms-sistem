import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Hapus Data",
  description = "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
  itemName = "",
  isLoading = false,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1.5 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-xs">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>

            {itemName && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono font-semibold text-slate-800 truncate">
                "{itemName}"
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-xl text-xs px-4 cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs px-4 shadow-sm cursor-pointer gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isLoading ? "Menghapus..." : "Ya, Hapus Data"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
