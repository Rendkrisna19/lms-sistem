import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { setExamLock } from "../../lib/examLock";

describe("BottomNav siswa", () => {
  it("menampilkan lima tab utama dan bisa diklik normal", () => {
    setExamLock(false);
    render(<MemoryRouter><BottomNav /></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
    ["Beranda", "Materi", "Ujian", "Tugas", "Nilai"].forEach((label) => {
      expect(screen.getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
    });
  });

  it("tab tidak bisa dipakai selama ujian berlangsung", () => {
    setExamLock(true);
    render(<MemoryRouter><BottomNav /></MemoryRouter>);
    expect(screen.queryByRole("link", { name: /Materi/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("Materi")[0].closest("[aria-disabled]")).toHaveAttribute("aria-disabled", "true");
    setExamLock(false);
  });
});
