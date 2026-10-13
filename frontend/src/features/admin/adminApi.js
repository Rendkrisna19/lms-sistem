import { api } from "../../lib/api";
import { downloadFromApi, postDownload } from "../../lib/download";

/**
 * Endpoint daftar data admin per role.
 * Admin master membaca /master/* (lintas sekolah, bisa difilter school_id).
 * Admin sekolah membaca /admin/* (server membatasi ke sekolahnya sendiri).
 */
export function adminListUrl(resource, isMaster) {
  return isMaster ? `/master/${resource}` : `/admin/${resource}`;
}

/** Nama berkas unduhan yang mudah dikenali, mis. "Daftar_Siswa_2026-10-14.xlsx". */
function exportFileName(resource, format) {
  const label = { teachers: "Guru", students: "Siswa", schools: "Sekolah" }[resource] ?? "Data";
  return `Daftar_${label}_${new Date().toISOString().slice(0, 10)}.${format}`;
}

/**
 * Aksi tulis dan berkas. Admin master WAJIB mengirim school_id (lihat useSchoolScope),
 * sehingga `params` dari scope selalu diteruskan. Admin sekolah mengirim params kosong.
 */
export const adminApi = {
  create: (resource, payload, params) => api.post(`/admin/${resource}`, payload, { params }).then((res) => res.data),
  update: (resource, id, payload, params) => api.put(`/admin/${resource}/${id}`, payload, { params }).then((res) => res.data),
  remove: (resource, id, params) => api.delete(`/admin/${resource}/${id}`, { params }).then((res) => res.data),

  /** Unduh template Excel yang sesuai sekolah (daftar kelas siswa ikut disertakan). */
  downloadTemplate: (resource, params) =>
    downloadFromApi(`/admin/${resource}/template`, `Template_${resource === "teachers" ? "Data_Guru" : "Data_Siswa"}.xlsx`, { params }),

  /**
   * Impor berkas. dryRun=true hanya memeriksa dan mengembalikan laporan tanpa menyimpan.
   * Server menjawab 422 bila masih ada baris yang salah, tetapi laporannya tetap dikirim di `data`.
   */
  importFile: (resource, file, { dryRun }, params) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dry_run", dryRun ? "1" : "0");
    return api.post(`/admin/${resource}/import`, formData, { params }).then((res) => res.data);
  },

  /** Ekspor baris tertentu (urutan mengikuti tabel). ids kosong/undefined = seluruh data sekolah. */
  exportFile: (resource, format, ids, params) =>
    postDownload(
      `/admin/${resource}/export`,
      { format, ...(ids ? { ids } : {}) },
      exportFileName(resource, format),
      { params }
    ),
};
