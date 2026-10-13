import { describe, expect, it } from "vitest";
import { deadlineTone, timeUntil } from "./deadline";

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const now = Date.parse("2026-10-14T08:00:00Z");

describe("tenggat penugasan", () => {
  it("menampilkan sisa waktu dalam hari dan jam", () => {
    expect(timeUntil(new Date(now + 2 * DAY + 4 * HOUR).toISOString(), now)).toBe("2 hari 4 jam");
    expect(timeUntil(new Date(now + 3 * HOUR + 15 * 60000).toISOString(), now)).toBe("3 jam 15 menit");
    expect(timeUntil(new Date(now + 20 * 60000).toISOString(), now)).toBe("20 menit");
  });

  it("tidak menampilkan sisa waktu setelah tenggat lewat", () => {
    expect(timeUntil(new Date(now - HOUR).toISOString(), now)).toBeNull();
  });

  it("memberi nada merah di bawah 24 jam dan kuning di bawah 3 hari", () => {
    expect(deadlineTone(new Date(now + 5 * HOUR).toISOString(), now)).toBe("red");
    expect(deadlineTone(new Date(now + 2 * DAY).toISOString(), now)).toBe("amber");
    expect(deadlineTone(new Date(now + 10 * DAY).toISOString(), now)).toBe("slate");
  });
});
