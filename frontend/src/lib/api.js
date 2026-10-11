import axios from "axios";

export const API_BASE_URL = "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Accept": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lms_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const savedUser = localStorage.getItem("lms_user");
  if (savedUser) {
    try {
      const u = JSON.parse(savedUser);
      if (u.role === "guru" && u.id) {
        config.headers["X-Teacher-Id"] = u.id;
      }
    } catch (e) {
      // ignore
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_user");
    }
    return Promise.reject(error);
  }
);
