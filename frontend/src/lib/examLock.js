import { useSyncExternalStore } from "react";

/**
 * Status "ujian sedang berlangsung". Selama terkunci, navigasi aplikasi (sidebar, menu mobile,
 * tombol keluar) dinonaktifkan agar siswa tidak meninggalkan ruang ujian sebelum mengumpulkan.
 */
let locked = false;
const listeners = new Set();

export function setExamLock(value) {
  if (locked === value) return;
  locked = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useExamLock() {
  return useSyncExternalStore(subscribe, () => locked, () => false);
}
