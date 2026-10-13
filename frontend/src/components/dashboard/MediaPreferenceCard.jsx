import { Activity } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/card";
import { MediaPreferenceBars } from "../admin/MediaPreferenceBars";

/** Ringkasan preferensi media belajar siswa sekolah (dari /admin/learning-analytics). */
export function MediaPreferenceCard({ summary }) {
  const total = summary?.total_media_interactions;
  const students = summary?.total_students_analyzed;

  return (
    <Card className="bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <CardHeader className="p-0 space-y-0">
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">Preferensi Media Belajar</span>
        </div>

        <div className="mt-3">
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{total ?? "–"}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {total == null ? "Akses materi belum tersedia" : `Akses materi oleh ${students ?? 0} siswa`}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <MediaPreferenceBars summary={summary} />
      </CardContent>
    </Card>
  );
}
