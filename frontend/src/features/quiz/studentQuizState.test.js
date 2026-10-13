import { describe, expect, it } from "vitest";
import { isStartable, studentQuizState } from "./studentQuizState";

describe("studentQuizState", () => {
  it("menandai ujian yang dibuka ulang sebagai retake, bukan selesai", () => {
    const quiz = { can_start: true, attempt: { status: "submitted", attempt_no: 1 }, status_state: "active" };
    expect(studentQuizState(quiz)).toBe("retake");
    expect(isStartable("retake")).toBe(true);
  });

  it("menandai ujian yang sudah dikumpulkan tanpa akses ulang sebagai selesai", () => {
    const quiz = { can_start: false, attempt: { status: "submitted", attempt_no: 1 }, status_state: "active" };
    expect(studentQuizState(quiz)).toBe("finished");
    expect(isStartable("finished")).toBe(false);
  });

  it("sesi yang sedang berjalan selalu lanjut, dan ujian baru mengikuti jadwal", () => {
    expect(studentQuizState({ attempt: { status: "in_progress" }, can_start: true })).toBe("in_progress");
    expect(studentQuizState({ attempt: null, can_start: false, status_state: "upcoming" })).toBe("upcoming");
    expect(studentQuizState({ attempt: null, can_start: true, status_state: "active" })).toBe("available");
  });
});
