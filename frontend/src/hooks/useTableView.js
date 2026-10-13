import { useCallback, useMemo, useState } from "react";
import { applyFilters, pageOf, searchRows, sortRows } from "../features/admin/tableView";

/**
 * Pencarian, filter, pengurutan, dan paginasi untuk tabel data di sisi klien.
 *
 * @param {object} config
 * @param {Array} config.rows
 * @param {Array<(row) => unknown>} config.searchFields
 * @param {Array<{id: string, match: (row, value) => boolean}>} config.filters  nilai "all" berarti tidak difilter
 * @param {Record<string, {label: string, accessor: (row) => unknown}>} config.sortColumns
 * @param {string} config.defaultSortKey
 * @param {number} [config.pageSize=10]
 */
export function useTableView({ rows, searchFields, filters = [], sortColumns, defaultSortKey, pageSize = 10 }) {
  const [query, setQueryState] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const result = useMemo(() => {
    const searched = searchRows(rows, query, searchFields);
    const active = filters
      .filter((filter) => (filterValues[filter.id] ?? "all") !== "all")
      .map((filter) => ({ id: filter.id, match: (row) => filter.match(row, filterValues[filter.id]) }));
    const filtered = applyFilters(searched, active);
    const sorted = sortRows(filtered, sortColumns[sortKey]?.accessor, sortDir);
    return { total: sorted.length, filtered: sorted, ...pageOf(sorted, page, pageSize) };
    // searchFields dan filters berupa konstanta di pemanggil; sengaja tidak dimasukkan ke dependensi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, filterValues, sortKey, sortDir, page, pageSize]);

  const setQuery = useCallback((value) => {
    setQueryState(value);
    setPage(1);
  }, []);

  const setFilter = useCallback((id, value) => {
    setFilterValues((prev) => ({ ...prev, [id]: value }));
    setPage(1);
  }, []);

  /** Dipakai dari pilihan urutan di atas tabel, format "kunci:asc" atau "kunci:desc". */
  const setSort = useCallback((key, dir) => {
    setSortKey(key);
    setSortDir(dir);
    setPage(1);
  }, []);

  /** Klik judul kolom: kolom baru mulai dari naik, kolom yang sama dibalik arahnya. */
  const toggleSort = useCallback(
    (key) => {
      if (key === sortKey) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortKey]
  );

  return {
    query,
    setQuery,
    filterValues,
    setFilter,
    sortKey,
    sortDir,
    sortValue: `${sortKey}:${sortDir}`,
    setSort,
    toggleSort,
    page: result.page,
    setPage,
    totalPages: result.totalPages,
    total: result.total,
    /** Semua baris yang lolos pencarian dan filter (sebelum dipotong halaman), dalam urutan tampil. */
    filteredRows: result.filtered,
    pageRows: result.rows,
  };
}
