import { formatDateTime } from "../../lib/datetime";

/** Sisa waktu sampai tenggat dalam bentuk ringkas, mis. "2 hari 4 jam" atau "45 menit". */
export function timeUntil(iso, now = Date.now()) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return null;

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
  return `${Math.max(minutes, 1)} menit`;
}

/** Nada warna tenggat: merah bila kurang dari 24 jam, kuning bila kurang dari 3 hari. */
export function deadlineTone(iso, now = Date.now()) {
  if (!iso) return "slate";
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "red";
  if (diff < 24 * 3600 * 1000) return "red";
  if (diff < 3 * 24 * 3600 * 1000) return "amber";
  return "slate";
}

/** Label status penugasan dari sisi guru (status_state dari server). */
export const ASSIGNMENT_STATE = {
  open: { label: "Berjalan", variant: "success" },
  late: { label: "Menerima terlambat", variant: "warning" },
  closed: { label: "Ditutup", variant: "muted" },
  inactive: { label: "Nonaktif", variant: "muted" },
};

/** Label dan nada status pengumpulan dari sisi siswa. */
export const SUBMISSION_STATE = {
  none: { label: "Belum dikumpulkan", variant: "warning" },
  submitted: { label: "Terkumpul", variant: "indigo" },
  late: { label: "Terlambat", variant: "destructive" },
  graded: { label: "Sudah dinilai", variant: "success" },
};

export function formatDue(iso) {
  return formatDateTime(iso);
}
