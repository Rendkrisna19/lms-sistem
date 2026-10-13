import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "../../lib/api";
import { adminApi } from "./adminApi";

/**
 * Alur hapus data admin dengan dialog konfirmasi.
 *
 * requestDelete({ resource, id, name, noun }) menyimpan target (dialog terbuka bila target ada).
 * noun dipakai di pesan, mis. "Data Guru" → `Data Guru "Nama" berhasil dihapus.`
 * Setelah berhasil, onDeleted() dipanggil (biasanya reload daftar).
 */
export function useAdminDelete({ writeParams, onDeleted }) {
  const [target, setTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = useCallback((item) => setTarget(item), []);
  const cancelDelete = useCallback(() => setTarget(null), []);

  const confirmDelete = useCallback(async () => {
    if (!target) return;
    setIsDeleting(true);
    try {
      await adminApi.remove(target.resource, target.id, writeParams);
      toast.success(`${target.noun} "${target.name}" berhasil dihapus.`);
      setTarget(null);
      onDeleted?.();
    } catch (err) {
      toast.error(getErrorMessage(err, `Gagal menghapus ${target.noun.toLowerCase()}.`));
    } finally {
      setIsDeleting(false);
    }
  }, [target, writeParams, onDeleted]);

  return { target, requestDelete, cancelDelete, confirmDelete, isDeleting };
}
