import { api } from "../../lib/api";
import { downloadFromApi } from "../../lib/download";

/** Layanan API modul ujian (guru & siswa). */
export const quizApi = {
  // Guru
  list: (config) => api.get("/teacher/quizzes", config).then((res) => res.data.data),
  options: (config) => api.get("/teacher/quiz-options", config).then((res) => res.data.data),
  detail: (id, config) => api.get(`/teacher/quizzes/${id}`, config).then((res) => res.data.data),
  create: (payload) => api.post("/teacher/quizzes", payload).then((res) => res.data),
  update: (id, payload) => api.put(`/teacher/quizzes/${id}`, payload).then((res) => res.data),
  toggleStatus: (id) => api.patch(`/teacher/quizzes/${id}/toggle-status`).then((res) => res.data),
  remove: (id) => api.delete(`/teacher/quizzes/${id}`).then((res) => res.data),
  grades: (id, config) => api.get(`/teacher/quizzes/${id}/grades`, config).then((res) => res.data.data),
  exportCsv: (id, title = "ujian") => downloadFromApi(`/teacher/quizzes/${id}/export-csv`, `rekap-nilai-${title}.csv`),
  grantRetake: (id, studentId) => api.post(`/teacher/quizzes/${id}/students/${studentId}/retake`).then((res) => res.data),
  revokeRetake: (id, studentId) => api.delete(`/teacher/quizzes/${id}/students/${studentId}/retake`).then((res) => res.data),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/teacher/quizzes/upload-image", formData).then((res) => res.data.url);
  },

  // Siswa
  studentList: (config) => api.get("/student/quizzes", config).then((res) => res.data.data),
  start: (id) => api.post(`/student/quizzes/${id}/start`).then((res) => res.data.data),
  saveAnswer: (attemptId, questionId, optionId) =>
    api
      .post(`/student/attempts/${attemptId}/answers`, { question_id: questionId, selected_option_id: optionId })
      .then((res) => res.data.data),
  submit: (attemptId) => api.post(`/student/attempts/${attemptId}/submit`).then((res) => res.data.data),
  result: (attemptId) => api.get(`/student/attempts/${attemptId}`).then((res) => res.data.data),
};
