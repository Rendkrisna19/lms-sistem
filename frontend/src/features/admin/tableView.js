/**
 * Logika tabel murni (tanpa React): pencarian, filter, dan pengurutan.
 * Dipisah agar bisa diuji dan dipakai ulang oleh semua tabel admin.
 */

const collator = new Intl.Collator("id", { numeric: true, sensitivity: "base" });

/** Teks dari nilai apa pun, untuk pencarian dan pengurutan. */
function textOf(value) {
  return value === null || value === undefined ? "" : String(value);
}

/**
 * @param {Array} rows
 * @param {string} query     kata kunci (tanpa membedakan huruf besar/kecil)
 * @param {Array<(row) => unknown>} fields  fungsi pengambil nilai yang ikut dicari
 */
export function searchRows(rows, query, fields) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return rows;
  return rows.filter((row) => fields.some((field) => textOf(field(row)).toLowerCase().includes(keyword)));
}

/**
 * @param {Array} rows
 * @param {Array<{id: string, match: (row) => boolean}>} filters  filter aktif (dilewati bila match null)
 */
export function applyFilters(rows, filters) {
  return filters.reduce((list, filter) => (filter.match ? list.filter(filter.match) : list), rows);
}

/**
 * Urutkan baris. `accessor` menentukan nilai pembanding; angka diurutkan secara numerik.
 * @param {"asc"|"desc"} direction
 */
export function sortRows(rows, accessor, direction = "asc") {
  if (!accessor) return rows;
  const factor = direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const left = accessor(a);
    const right = accessor(b);
    if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
    return collator.compare(textOf(left), textOf(right)) * factor;
  });
}

/** Potong baris untuk satu halaman (halaman dimulai dari 1). */
export function pageOf(rows, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  return {
    page: safePage,
    totalPages,
    rows: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
}

/**
 * Pilihan urutan untuk dropdown dari daftar kolom yang dapat diurutkan.
 * Setiap kolom menyebut label arah naik dan turun, mis. { asc: "Nama A–Z", desc: "Nama Z–A" }.
 * @param {Record<string, {accessor: (row) => unknown, asc: string, desc: string}>} sortColumns
 */
export function sortOptionsOf(sortColumns) {
  return Object.entries(sortColumns).flatMap(([key, column]) => [
    { value: `${key}:asc`, label: column.asc },
    { value: `${key}:desc`, label: column.desc },
  ]);
}
