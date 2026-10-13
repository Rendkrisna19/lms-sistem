import { describe, expect, it } from "vitest";
import { applyFilters, pageOf, searchRows, sortOptionsOf, sortRows } from "./tableView";

const rows = [
  { id: 1, name: "Siti Aisyah", nis: "20241002", kelas: "X IPA 2", mapel: 2 },
  { id: 2, name: "Ahmad Fajar", nis: "20241001", kelas: "X IPA 1", mapel: 0 },
  { id: 3, name: "budi pratama", nis: "9", kelas: "X IPA 10", mapel: 5 },
];

describe("pencarian", () => {
  it("mencari di beberapa kolom tanpa membedakan huruf besar", () => {
    const fields = [(r) => r.name, (r) => r.nis];
    expect(searchRows(rows, "BUDI", fields).map((r) => r.id)).toEqual([3]);
    expect(searchRows(rows, "2024100", fields).map((r) => r.id)).toEqual([1, 2]);
    expect(searchRows(rows, "20241001", fields).map((r) => r.id)).toEqual([2]);
    expect(searchRows(rows, "   ", fields)).toHaveLength(3);
  });
});

describe("pengurutan", () => {
  const byName = (r) => r.name;

  it("naik dan turun untuk teks dengan urutan bahasa Indonesia", () => {
    expect(sortRows(rows, byName, "asc").map((r) => r.name)).toEqual(["Ahmad Fajar", "budi pratama", "Siti Aisyah"]);
    expect(sortRows(rows, byName, "desc").map((r) => r.name)).toEqual(["Siti Aisyah", "budi pratama", "Ahmad Fajar"]);
  });

  it("angka diurutkan secara numerik, bukan teks (9 sebelum 20241001)", () => {
    expect(sortRows(rows, (r) => r.nis, "asc").map((r) => r.nis)).toEqual(["9", "20241001", "20241002"]);
  });

  it("mengurutkan kelas dengan angka di dalam nama (X IPA 2 sebelum X IPA 10)", () => {
    expect(sortRows(rows, (r) => r.kelas, "asc").map((r) => r.kelas)).toEqual(["X IPA 1", "X IPA 2", "X IPA 10"]);
  });

  it("tidak mengubah urutan asli", () => {
    const copy = [...rows];
    sortRows(rows, byName, "desc");
    expect(rows).toEqual(copy);
  });
});

describe("filter dan paginasi", () => {
  it("menerapkan hanya filter yang aktif", () => {
    const withMapel = { id: "mapel", match: (r) => r.mapel > 0 };
    expect(applyFilters(rows, [withMapel]).map((r) => r.id)).toEqual([1, 3]);
    expect(applyFilters(rows, [])).toHaveLength(3);
  });

  it("memotong halaman dan membatasi nomor halaman yang tidak valid", () => {
    const sized = Array.from({ length: 25 }, (_, i) => ({ i }));
    expect(pageOf(sized, 1, 10)).toMatchObject({ page: 1, totalPages: 3 });
    expect(pageOf(sized, 3, 10).rows).toHaveLength(5);
    expect(pageOf(sized, 9, 10).page).toBe(3);
    expect(pageOf([], 1, 10)).toMatchObject({ page: 1, totalPages: 1, rows: [] });
  });
});

describe("opsi urutan", () => {
  it("membuat pasangan naik dan turun untuk setiap kolom", () => {
    const options = sortOptionsOf({ name: { accessor: (r) => r.name, asc: "Nama A–Z", desc: "Nama Z–A" } });
    expect(options).toEqual([
      { value: "name:asc", label: "Nama A–Z" },
      { value: "name:desc", label: "Nama Z–A" },
    ]);
  });
});
