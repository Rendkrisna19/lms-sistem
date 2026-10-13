import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const school = { id: 1, name: "SMA Mitra Inalum", npsn: "10203040", jenjang: "SMA", status: "active", address: "Batu Bara", phone: "0622", email: "a@b.id", students_count: 20, teachers_count: 4, classrooms_count: 2, courses_count: 3, admin: { name: "Admin", nomor_induk: "ADM1", email: "x@y.id" } };
const classroom = { id: 1, school_id: 1, name: "X IPA 1", code: "X-IPA-1", academic_year: "2026/2027", students_count: 10, school: { name: "SMA Mitra Inalum" }, homeroom_teacher: { name: "Ratna" }, subject_assignments: [{ id: 1, course: { title: "Matematika" }, teacher: { name: "Dr" } }] };
const teacher = { id: 2, name: "Guru Uji", nomor_induk: "19990001", email: "g@x.id", school: { name: "SMA" }, teaching_assignments_count: 2, education_level: "S1" };
const student = { id: 3, name: "Siswa Uji", nomor_induk: "20260001", email: "s@x.id", classroom: { name: "X IPA 1" }, school: { name: "SMA" }, city: "Batu Bara" };

const scope = { isMaster: true, canWrite: true, schoolId: "all", schools: [school], schoolsLoading: false, setSchoolId: () => {}, params: {} };

vi.mock("../hooks/useApiQuery", () => ({
  useApiQuery: (url) => {
    const rows = url?.includes("schools") ? [school] : url?.includes("classrooms") ? [classroom] : url?.includes("teachers") ? [teacher] : url?.includes("students") ? [student] : [];
    return { data: rows, isLoading: false, error: null, reload: () => {}, setData: () => {} };
  },
}));
vi.mock("../features/admin/useAdminResource", () => ({
  useAdminResource: (resource) => {
    const map = { classrooms: [classroom], teachers: [teacher], students: [student] };
    return { rows: map[resource] ?? [], isLoading: false, error: null, reload: () => {}, scope, canWrite: true, writeParams: {} };
  },
}));
vi.mock("../hooks/useSchoolScope", () => ({ useSchoolScope: () => scope }));

const pages = [
  ["SchoolsPage", "Data sekolah", "../pages/SchoolsPage"],
  ["ClassroomsPage", "Data kelas", "./ClassroomsPage"],
  ["TeachersPage", "Data guru", "./TeachersPage"],
  ["StudentsPage", "Data siswa", "./StudentsPage"],
  ["ManajemenUserPage", "Manajemen user", "./ManajemenUserPage"],
];

describe("halaman admin dirender tanpa error runtime", () => {
  for (const [name, heading, path] of pages) {
    it(name, async () => {
      const mod = await import(/* @vite-ignore */ path);
      const Page = mod[name];
      render(<MemoryRouter><Page currentUser={{ role: "admin_master" }} /></MemoryRouter>);
      expect(screen.getAllByText(heading).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Mode lihat semua sekolah/)).not.toBeInTheDocument();
    });
  }
});
