import { api } from "../../lib/api";

/**
 * Profil sekolah, admin sekolah, dan daftar akun. Admin master memilih sekolah lewat school_id (params).
 */
export const schoolApi = {
  get: (params) => api.get("/admin/school", { params }).then((res) => res.data.data),
  save: (formData, params) => api.post("/admin/school", formData, { params }).then((res) => res.data),
  createAdmin: (payload, params) => api.post("/admin/admins", payload, { params }).then((res) => res.data),
  removeAdmin: (id, params) => api.delete(`/admin/admins/${id}`, { params }).then((res) => res.data),
  accounts: (params) => api.get("/admin/accounts", { params }).then((res) => res.data.data),
};

export const ACCREDITATION_OPTIONS = [
  { value: "", label: "Belum diisi" },
  { value: "A", label: "Akreditasi A" },
  { value: "B", label: "Akreditasi B" },
  { value: "C", label: "Akreditasi C" },
  { value: "Belum Terakreditasi", label: "Belum terakreditasi" },
];

export const JENJANG_OPTIONS = [
  { value: "", label: "Pilih jenjang" },
  ...["SD", "SMP", "SMA", "SMK", "MA", "MTs"].map((value) => ({ value, label: value })),
];
