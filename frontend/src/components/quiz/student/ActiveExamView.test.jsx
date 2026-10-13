import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { quizApi } from "../../../features/quiz/api";
import { ActiveExamView } from "./ActiveExamView";

vi.mock("../../../features/quiz/api", () => ({
  quizApi: {
    saveAnswer: vi.fn(() => Promise.resolve({})),
    submit: vi.fn(),
    result: vi.fn(),
  },
}));

const session = {
  attempt: { id: 6, deadline_at: new Date(Date.now() + 30 * 60000).toISOString() },
  server_time: new Date().toISOString(),
  quiz: { title: "Kuis Uji", course: { title: "Rekayasa Perangkat Lunak" } },
  answers: {},
  questions: [
    {
      id: 1,
      question_text: "<p>Soal pertama</p>",
      points: 50,
      options: [
        { id: 11, option_label: "A", option_text: "<p>Satu</p>" },
        { id: 12, option_label: "B", option_text: "<p>Dua</p>" },
      ],
    },
    {
      id: 2,
      question_text: "<p>Soal kedua</p>",
      points: 50,
      options: [
        { id: 21, option_label: "A", option_text: "<p>Tiga</p>" },
        { id: 22, option_label: "B", option_text: "<p>Empat</p>" },
      ],
    },
  ],
};

function renderExam() {
  const router = createMemoryRouter(
    [
      { path: "/ujian/8/kerjakan", element: <ActiveExamView session={session} onFinished={vi.fn()} /> },
      { path: "/ujian", element: <p>Daftar ujian</p> },
    ],
    { initialEntries: ["/ujian/8/kerjakan"] }
  );
  return render(<RouterProvider router={router} />);
}

describe("ruang ujian aktif", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tidak menyediakan tombol mundur, tanda ragu-ragu, atau lompat nomor soal", () => {
    renderExam();
    expect(screen.queryByRole("button", { name: /sebelumnya/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ragu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /soal \d/i })).not.toBeInTheDocument();
  });

  it("tombol soal berikutnya terkunci sampai soal dijawab", async () => {
    renderExam();
    const next = screen.getByRole("button", { name: /soal berikutnya/i });
    expect(next).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /Satu/ }));

    await waitFor(() => expect(quizApi.saveAnswer).toHaveBeenCalledWith(6, 1, 11));
    expect(screen.getByRole("button", { name: /soal berikutnya/i })).toBeEnabled();
  });

  it("setelah lanjut, soal sebelumnya tidak dapat diubah dan soal berikutnya tampil", async () => {
    renderExam();
    fireEvent.click(screen.getByRole("radio", { name: /Satu/ }));
    await waitFor(() => expect(quizApi.saveAnswer).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /soal berikutnya/i }));

    expect(screen.getByText(/Soal 2/)).toBeInTheDocument();
    expect(screen.getByText(/Soal kedua/)).toBeInTheDocument();
  });

  it("kumpulkan ujian baru aktif setelah semua soal terjawab", async () => {
    renderExam();
    fireEvent.click(screen.getByRole("radio", { name: /Satu/ }));
    await waitFor(() => expect(quizApi.saveAnswer).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /soal berikutnya/i }));

    const submit = screen.getByRole("button", { name: /kumpulkan ujian/i });
    expect(submit).toBeDisabled();
    expect(screen.getByText(/masih ada 1 soal/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /Tiga/ }));
    await waitFor(() => expect(quizApi.saveAnswer).toHaveBeenCalledWith(6, 2, 21));
    expect(screen.getByRole("button", { name: /kumpulkan ujian/i })).toBeEnabled();
  });
});
