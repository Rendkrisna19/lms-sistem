/**
 * Status tampilan sebuah ujian dari sudut pandang siswa.
 * - retake: percobaan sebelumnya sudah dikumpulkan, dan guru membuka kesempatan ujian ulang.
 */
export function studentQuizState(quiz) {
  const attempt = quiz.attempt;
  if (attempt?.status === "in_progress") return "in_progress";
  if (attempt && quiz.can_start) return "retake";
  if (attempt) return "finished";
  if (quiz.status_state === "upcoming") return "upcoming";
  if (quiz.status_state === "closed") return "closed";
  return quiz.can_start ? "available" : "unavailable";
}

/** Ujian yang bisa dimulai sekarang (baru maupun ujian ulang). */
export function isStartable(state) {
  return state === "available" || state === "retake";
}
