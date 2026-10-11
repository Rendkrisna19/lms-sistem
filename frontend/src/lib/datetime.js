const pad = (value) => String(value).padStart(2, "0");

/**
 * ISO dari server (mis. "2030-01-10T08:00:00+07:00") → nilai input datetime-local
 * dalam zona waktu perangkat ("2030-01-10T08:00").
 */
export function toDateTimeLocalValue(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Nilai input datetime-local (waktu lokal) → ISO UTC untuk dikirim ke server. */
export function fromDateTimeLocalValue(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function formatDateTime(iso, options = {}) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

export function formatDate(iso) {
  return formatDateTime(iso, { hour: undefined, minute: undefined });
}

/** Detik → "mm:ss" atau "h:mm:ss". */
export function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Durasi menit → "1 jam 30 menit". */
export function formatMinutes(minutes) {
  const value = Number(minutes) || 0;
  const h = Math.floor(value / 60);
  const m = value % 60;
  if (h && m) return `${h} jam ${m} menit`;
  if (h) return `${h} jam`;
  return `${m} menit`;
}

/** "dalam 2 hari", "3 jam lagi", dsb. untuk jadwal yang akan datang. */
export function formatRelativeFuture(iso, now = Date.now()) {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "sekarang";
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${minutes} menit lagi`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lagi`;
  return `${Math.round(hours / 24)} hari lagi`;
}
