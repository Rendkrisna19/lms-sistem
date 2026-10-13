import { useState } from "react";

/**
 * Paginasi sisi klien. Halaman dibatasi otomatis bila jumlah data berkurang (mis. setelah filter sekolah berubah).
 */
export function usePagedList(items, perPage) {
  const [requestedPage, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const page = Math.min(requestedPage, totalPages);
  const pageItems = items.slice((page - 1) * perPage, page * perPage);

  return { page, setPage, totalPages, pageItems };
}
