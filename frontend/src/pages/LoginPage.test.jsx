import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";

vi.mock("../lib/auth", () => ({ useAuth: () => ({ login: vi.fn() }) }));

describe("LoginPage", () => {
  it("menampilkan formulir dan menolak pengiriman kosong", () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /selamat datang/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));
    expect(screen.getByText(/Nomor induk \(NIP, NIS, atau ID admin\) wajib diisi/)).toBeInTheDocument();
    expect(screen.getByText(/Kata sandi wajib diisi/)).toBeInTheDocument();
  });
});
