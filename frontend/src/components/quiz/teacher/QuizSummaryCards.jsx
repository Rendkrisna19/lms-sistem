import { CalendarClock, CheckCircle2, FileQuestion, Layers, PencilLine } from "lucide-react";
import { StatCard } from "../../ui/stat-card";

export function QuizSummaryCards({ summary, isLoading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <StatCard label="Total Ujian" value={summary?.total} suffix="paket" icon={Layers} tone="slate" isLoading={isLoading} />
      <StatCard label="Aktif" value={summary?.total_active} suffix="berjalan" icon={CheckCircle2} tone="emerald" isLoading={isLoading} />
      <StatCard label="Terjadwal" value={summary?.total_upcoming} suffix="akan datang" icon={CalendarClock} tone="indigo" isLoading={isLoading} />
      <StatCard label="Bank Soal" value={summary?.total_questions} suffix="butir" icon={FileQuestion} tone="brand" isLoading={isLoading} />
      <StatCard label="Draf / Nonaktif" value={summary?.total_inactive} icon={PencilLine} tone="amber" isLoading={isLoading} />
    </div>
  );
}
