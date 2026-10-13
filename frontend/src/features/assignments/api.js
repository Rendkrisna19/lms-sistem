import { api } from "../../lib/api";

/**
 * Layanan API penugasan. Pembuatan, ubah, dan pengumpulan memakai multipart (dapat memuat berkas).
 * Ubah memakai POST dengan _method=PUT karena PHP tidak membaca berkas dari request PUT.
 */
export const assignmentApi = {
  // Guru
  options: () => api.get("/teacher/quiz-options").then((res) => res.data.data.assigned_options),
  teacherList: () => api.get("/teacher/assignments").then((res) => res.data.data.assignments),
  teacherDetail: (id) => api.get(`/teacher/assignments/${id}`).then((res) => res.data.data),
  create: (formData) => api.post("/teacher/assignments", formData).then((res) => res.data),
  update: (id, formData) => {
    formData.append("_method", "PUT");
    return api.post(`/teacher/assignments/${id}`, formData).then((res) => res.data);
  },
  remove: (id) => api.delete(`/teacher/assignments/${id}`).then((res) => res.data),
  grade: (id, submissionId, payload) =>
    api.put(`/teacher/assignments/${id}/submissions/${submissionId}`, payload).then((res) => res.data),

  // Siswa
  studentList: () => api.get("/student/assignments").then((res) => res.data.data),
  studentDetail: (id) => api.get(`/student/assignments/${id}`).then((res) => res.data.data),
  submit: (id, formData) => api.post(`/student/assignments/${id}/submit`, formData).then((res) => res.data),
};
