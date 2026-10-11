import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "../../lib/api";
import { quizApi } from "./api";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Validasi di sisi klien sebelum upload; mengembalikan pesan error atau null. */
export function validateImageFile(file) {
  if (!file) return "Berkas tidak ditemukan.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Format gambar harus JPG, PNG, GIF, atau WEBP.";
  if (file.size > MAX_IMAGE_BYTES) return "Ukuran gambar maksimal 5 MB.";
  return null;
}

/**
 * Upload gambar soal / jawaban ke server. Mengembalikan URL atau null bila gagal
 * (pesan kesalahan ditampilkan lewat toast).
 */
export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(async (file) => {
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return null;
    }
    setIsUploading(true);
    const toastId = toast.loading("Mengunggah gambar...");
    try {
      const url = await quizApi.uploadImage(file);
      toast.success("Gambar berhasil diunggah.", { id: toastId });
      return url;
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal mengunggah gambar."), { id: toastId });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, isUploading };
}
