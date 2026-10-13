/** Angka dengan satuan, atau "–" bila data belum tersedia (jangan tampilkan 0 palsu). */
export function countLabel(value, unit) {
  return value == null ? "–" : `${value} ${unit}`;
}

/** Persentase dengan satuan, atau "–" bila data belum tersedia. */
export function percentLabel(value) {
  return value == null ? "–" : `${value}%`;
}
