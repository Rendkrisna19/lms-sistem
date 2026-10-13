import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "../lib/auth";
import { useApiQuery } from "./useApiQuery";

const STORAGE_KEY = "lms_master_school_scope";

/*
 * Pilihan sekolah disimpan dalam satu store modul (dan sessionStorage) agar setiap komponen
 * yang memakai hook ini — halaman, modal, dashboard — membaca pilihan yang sama.
 */
const listeners = new Set();

function readStoredScope() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || "all";
  } catch {
    return "all";
  }
}

let selectedScope = readStoredScope();

function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return selectedScope;
}

function storeScope(next) {
  selectedScope = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, next);
  } catch {
    // sessionStorage tidak tersedia; pilihan hanya berlaku selama halaman dibuka
  }
  listeners.forEach((listener) => listener());
}

/**
 * Cakupan sekolah untuk halaman admin.
 *
 * - Admin sekolah: selalu sekolahnya sendiri (server mengabaikan school_id).
 * - Admin master: memilih sekolah dari daftar. Endpoint /admin/* WAJIB menerima `school_id`,
 *   jadi aksi tulis hanya diizinkan bila satu sekolah dipilih.
 */
export function useSchoolScope() {
  const { role } = useAuth();
  const isMaster = role === "admin_master";
  const storedId = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // /admin/schools hanya boleh dipanggil admin master (admin sekolah → 403)
  const schoolsQuery = useApiQuery(isMaster ? "/admin/schools" : null);
  const schools = useMemo(() => schoolsQuery.data ?? [], [schoolsQuery.data]);

  // Abaikan pilihan tersimpan yang sudah tidak ada (mis. sekolah dihapus)
  const schoolId =
    isMaster && storedId !== "all" && (schoolsQuery.isLoading || schools.some((s) => String(s.id) === storedId))
      ? storedId
      : "all";

  const setSchoolId = useCallback((value) => storeScope(value ? String(value) : "all"), []);

  const hasSchool = !isMaster || schoolId !== "all";
  const selectedSchool = isMaster ? schools.find((s) => String(s.id) === schoolId) ?? null : null;

  /** Parameter yang wajib ikut di setiap panggilan /admin/* (kosong untuk admin sekolah). */
  const params = useMemo(() => (isMaster && schoolId !== "all" ? { school_id: Number(schoolId) } : {}), [isMaster, schoolId]);

  return {
    isMaster,
    schools,
    schoolsLoading: schoolsQuery.isLoading,
    schoolsError: schoolsQuery.error,
    reloadSchools: schoolsQuery.reload,
    schoolId,
    setSchoolId,
    selectedSchool,
    /** true bila boleh membuat/mengubah/menghapus data (admin sekolah, atau master dengan sekolah terpilih) */
    canWrite: hasSchool,
    params,
  };
}
