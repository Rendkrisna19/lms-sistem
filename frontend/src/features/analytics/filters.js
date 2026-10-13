/** Filter baris siswa di tabel analitik (pencarian teks + model media dominan). */
export function filterStudents(students, { search = "", media = "all" } = {}) {
  const keyword = search.trim().toLowerCase();

  return students.filter((student) => {
    const matchesSearch =
      !keyword ||
      [student.name, student.nis, student.classroom_name, student.school_name].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );

    const style = student.dominant_style ?? "";
    const matchesMedia =
      media === "all" ||
      (media === "pdf" && style.includes("PDF")) ||
      (media === "audio" && style.includes("Audio")) ||
      (media === "video" && style.includes("Video"));

    return matchesSearch && matchesMedia;
  });
}

export const MEDIA_FILTER_OPTIONS = [
  { value: "all", label: "Semua model media" },
  { value: "pdf", label: "Dokumen (PDF)" },
  { value: "audio", label: "Audio (suara)" },
  { value: "video", label: "Video tutorial" },
];
