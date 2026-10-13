/**
 * Data profil guru dan siswa: pilihan baku (sejalan dengan App\Support\UserProfile di backend),
 * pemetaan form <-> payload, dan format tampilan.
 */

export const GENDER_LABELS = { L: "Laki-laki", P: "Perempuan" };

export const GENDER_OPTIONS = [
  { value: "", label: "Belum diisi" },
  { value: "L", label: "Laki-laki" },
  { value: "P", label: "Perempuan" },
];

export const EDUCATION_OPTIONS = [
  { value: "", label: "Belum diisi" },
  ...["SD", "SMP", "SMA/SMK", "D3", "S1", "S2", "S3"].map((value) => ({ value, label: value })),
];

export const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Belum diisi" },
  ...["PNS", "PPPK", "Tetap Yayasan", "Kontrak", "Honorer"].map((value) => ({ value, label: value })),
];

/** Field yang dimiliki guru maupun siswa. */
export const PERSONAL_KEYS = ["gender", "birth_place", "birth_date", "phone", "city", "address"];
export const TEACHER_KEYS = ["education_level", "education_major", "employment_status", "join_date"];
export const STUDENT_KEYS = ["admission_year", "previous_school", "parent_name", "parent_phone", "parent_job"];

const DATE_KEYS = ["birth_date", "join_date"];

/** Nilai awal form dari data pengguna (null menjadi string kosong). */
export function profileToForm(user, keys) {
  return Object.fromEntries(keys.map((key) => [key, user?.[key] == null ? "" : String(user[key])]));
}

/**
 * Payload untuk server: string kosong menjadi null, angka dikonversi, dan tanggal dikirim apa adanya (yyyy-mm-dd).
 */
export function formToPayload(values, keys) {
  return Object.fromEntries(
    keys.map((key) => {
      const raw = (values[key] ?? "").toString().trim();
      if (raw === "") return [key, null];
      if (key === "admission_year") return [key, Number(raw)];
      return [key, raw];
    })
  );
}

/** Tanggal yyyy-mm-dd ditampilkan tanpa pergeseran zona waktu, mis. "15 Juli 1985". */
export function formatBirthDate(value) {
  if (!value) return "–";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function genderLabel(code) {
  return GENDER_LABELS[code] ?? "–";
}

/** Umur dalam tahun dari tanggal lahir, atau null. */
export function ageFrom(value, now = new Date()) {
  const match = value ? String(value).match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  if (!match) return null;
  const [, year, month, day] = match;
  let age = now.getFullYear() - Number(year);
  const beforeBirthday = now.getMonth() + 1 < Number(month) || (now.getMonth() + 1 === Number(month) && now.getDate() < Number(day));
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

export { DATE_KEYS };
