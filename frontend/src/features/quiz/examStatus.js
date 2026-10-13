import { formatDateTime } from "../../lib/datetime";

/** Alasan ujian belum bisa dimulai (null = boleh dimulai). */
export function startBlockedReason(quiz) {
  if (quiz.can_start) return null;
  if (quiz.status_state === "upcoming") return `Ujian belum dibuka. Jadwal mulai: ${formatDateTime(quiz.starts_at)}.`;
  if (quiz.status_state === "closed") return "Jadwal ujian sudah ditutup.";
  if (!quiz.total_questions) return "Ujian ini belum memiliki butir soal. Hubungi guru pengampu.";
  return "Ujian saat ini belum dapat dimulai.";
}
