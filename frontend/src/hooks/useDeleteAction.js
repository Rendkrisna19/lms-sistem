import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "../lib/api";

/**
 * State + handler untuk dialog konfirmasi hapus.
 * Error dari server (mis. 422 dengan `dependencies`) ditampilkan di dalam dialog, bukan dianggap sukses.
 *
 * @param {(item) => Promise<any>} request  fungsi yang memanggil API hapus
 * @param {{ onDeleted?: (item) => void, successMessage?: (item) => string, fallbackError?: string }} options
 */
export function useDeleteAction(request, { onDeleted, successMessage, fallbackError = "Gagal menghapus data." } = {}) {
  const [target, setTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const open = useCallback((item) => {
    setTarget(item);
    setError(null);
  }, []);

  const close = useCallback(() => {
    setTarget(null);
    setError(null);
  }, []);

  const confirm = async () => {
    if (!target) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await request(target);
      toast.success(successMessage?.(target) ?? res?.data?.message ?? "Data berhasil dihapus.");
      onDeleted?.(target);
      setTarget(null);
    } catch (err) {
      const message = getErrorMessage(err, fallbackError);
      const dependencies = err?.response?.data?.dependencies ?? null;
      setError({ message, dependencies });
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return { target, isOpen: Boolean(target), isDeleting, error, open, close, confirm };
}
