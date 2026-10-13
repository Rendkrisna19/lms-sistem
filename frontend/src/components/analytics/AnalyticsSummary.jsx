import { FileText, GraduationCap, Video, Volume2 } from "lucide-react";
import { StatCard } from "../ui/stat-card";

/** Empat kartu ringkasan: jumlah siswa dan persentase akses per model media. */
export function AnalyticsSummary({ summary, isLoading }) {
  const hasActivity = Boolean(summary?.total_media_interactions);
  const percent = (value) => (hasActivity ? value ?? 0 : null);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Siswa dianalisis"
        value={summary?.total_students_analyzed}
        icon={GraduationCap}
        tone="brand"
        isLoading={isLoading}
        hint={hasActivity ? `${summary.total_media_interactions} kali akses materi` : "Belum ada akses materi"}
      />
      <StatCard label="Dokumen PDF" value={percent(summary?.pdf_percentage)} suffix="%" icon={FileText} tone="red" isLoading={isLoading} hint="Persentase akses" />
      <StatCard label="Audio suara" value={percent(summary?.audio_percentage)} suffix="%" icon={Volume2} tone="indigo" isLoading={isLoading} hint="Persentase akses" />
      <StatCard label="Video tutorial" value={percent(summary?.video_percentage)} suffix="%" icon={Video} tone="brand" isLoading={isLoading} hint="Persentase akses" />
    </div>
  );
}
