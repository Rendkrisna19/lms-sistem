import { FileText, Volume2, Video } from "lucide-react";
import { percentLabel } from "../../features/admin/format";

const MEDIA = [
  { key: "pdf_percentage", label: "Model 1: Dokumen (PDF & Teks)", Icon: FileText, bar: "bg-blue-600" },
  { key: "audio_percentage", label: "Model 2: Audio (Rekaman Suara)", Icon: Volume2, bar: "bg-blue-500" },
  { key: "video_percentage", label: "Model 3: Video Tutorial", Icon: Video, bar: "bg-blue-700" },
];

/**
 * Persentase akses materi per jenis media (dari /learning-analytics). Tampilkan "–" bila summary belum ada.
 */
export function MediaPreferenceBars({ summary }) {
  return (
    <div className="space-y-4 mt-3">
      {MEDIA.map(({ key, label, Icon, bar }) => {
        const value = summary?.[key];
        return (
          <div key={key} className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-blue-600" />
                <span>{label}</span>
              </span>
              <span className="text-blue-700 font-extrabold">{value == null ? "–" : `${percentLabel(value)} akses`}</span>
            </div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-blue-100">
              <div className={`${bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${value ?? 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
