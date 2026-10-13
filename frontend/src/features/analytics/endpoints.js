import { ROLES } from "../../lib/navigation";

/**
 * Endpoint analitik keaktifan belajar siswa per role.
 * Cakupan data tetap dibatasi di server (guru: kelas ajarnya, admin sekolah: sekolahnya).
 */
export const LEARNING_ANALYTICS_URL = {
  [ROLES.ADMIN_MASTER]: "/master/learning-analytics",
  [ROLES.ADMIN]: "/admin/learning-analytics",
  [ROLES.TEACHER]: "/teacher/learning-analytics",
};

export function learningAnalyticsUrl(role) {
  return LEARNING_ANALYTICS_URL[role] ?? null;
}
