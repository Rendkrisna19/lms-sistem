import { useEffect } from "react";
import { toast } from "sonner";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useSchoolScope } from "../../hooks/useSchoolScope";
import { adminListUrl } from "./adminApi";

/**
 * Daftar data admin (guru, siswa, kelas, mapel, analitik) untuk semua role admin.
 *
 * - rows       : data daftar (selalu array)
 * - canWrite   : boleh tambah/ubah/hapus (admin sekolah, atau master dengan sekolah terpilih)
 * - writeParams: school_id yang wajib ikut setiap aksi tulis (kosong untuk admin sekolah)
 * - scope      : cakupan sekolah lengkap (dipakai untuk filter dropdown)
 *
 * Admin master membaca /master/* (lintas sekolah, atau satu sekolah bila school_id dipilih).
 * Admin sekolah membaca /admin/* (server membatasi ke sekolahnya sendiri).
 *
 * options.enabled: false = jangan ambil data (mis. modal yang belum dibuka).
 */
export function useAdminResource(resource, { enabled = true } = {}) {
  const scope = useSchoolScope();
  const url = adminListUrl(resource, scope.isMaster);
  const list = useApiQuery(enabled ? url : null, {
    params: scope.params,
    select: (body) => body.data ?? [],
  });

  useEffect(() => {
    if (list.error) toast.error(list.error);
  }, [list.error]);

  return {
    rows: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error,
    reload: list.reload,
    scope,
    canWrite: scope.canWrite,
    writeParams: scope.params,
  };
}
