import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const TOKEN_STORAGE_KEY = "lms_token";
export const USER_STORAGE_KEY = "lms_user";

/** Event global saat server menolak token (401) agar AuthProvider bisa mengakhiri sesi. */
export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.endsWith("/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

/** Ambil pesan error yang ramah dari respons Laravel. */
export function getErrorMessage(error, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  if (!error?.response) {
    return error?.code === "ERR_CANCELED" ? fallback : "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  }
  const data = error.response.data;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  return data?.message || fallback;
}

/** Ambil error validasi Laravel (422) dalam bentuk { field: pesan }. */
export function getValidationErrors(error) {
  const errors = error?.response?.status === 422 ? error.response.data?.errors : null;
  if (!errors) return {};
  return Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages?.[0]]));
}

export function isCanceled(error) {
  return axios.isCancel(error) || error?.code === "ERR_CANCELED";
}
