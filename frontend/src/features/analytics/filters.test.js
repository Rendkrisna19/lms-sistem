import { describe, expect, it } from "vitest";
import { filterStudents } from "./filters";

const students = [
  { id: 1, name: "Ahmad Fajar", nis: "20241001", classroom_name: "X IPA 1", dominant_style: "Visual (Dokumen PDF)" },
  { id: 2, name: "Siti Aisyah", nis: "20241002", classroom_name: "X IPA 2", dominant_style: "Auditori (Audio Suara Guru)" },
];

describe("filterStudents", () => {
  it("mencari berdasarkan nama, NIS, atau kelas tanpa membedakan huruf besar", () => {
    expect(filterStudents(students, { search: "aisyah" }).map((s) => s.id)).toEqual([2]);
    expect(filterStudents(students, { search: "20241001" }).map((s) => s.id)).toEqual([1]);
    expect(filterStudents(students, { search: "x ipa 2" }).map((s) => s.id)).toEqual([2]);
  });

  it("memfilter berdasarkan model media dominan", () => {
    expect(filterStudents(students, { media: "pdf" }).map((s) => s.id)).toEqual([1]);
    expect(filterStudents(students, { media: "audio" }).map((s) => s.id)).toEqual([2]);
    expect(filterStudents(students, { media: "video" })).toEqual([]);
  });
});
