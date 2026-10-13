import { Calendar, Clock, FileText, Video, Volume2 } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AudioPreview, PdfPreview, VideoPreview } from "../materials/MediaPlayers";
import { formatDateTime } from "../../lib/datetime";

const TYPE_META = {
  document: { label: "Dokumen PDF", icon: FileText, tone: "bg-red-50 text-red-700 border-red-200" },
  audio: { label: "Audio suara", icon: Volume2, tone: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  video: { label: "Video pembelajaran", icon: Video, tone: "bg-blue-50 text-blue-700 border-blue-200" },
};

/** Pratinjau materi langsung di dalam aplikasi: PDF tampil di halaman, audio dan video dapat diputar. */
export function MaterialPreviewModal({ isOpen, onClose, material }) {
  if (!material) return null;

  const meta = TYPE_META[material.content_type] ?? TYPE_META.document;
  const Icon = meta.icon;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      size="xl"
      title={material.title}
      description={[material.course?.title, material.classroom?.name && `${material.classroom.name} (${material.classroom.code})`]
        .filter(Boolean)
        .join(" • ")}
      footer={
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`gap-1.5 ${meta.tone}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {meta.label}
          </Badge>
          <Badge variant={material.is_active ? "success" : "muted"}>{material.is_active ? "Aktif" : "Nonaktif"}</Badge>
          {material.is_expired && <Badge variant="destructive">Kedaluwarsa</Badge>}
        </div>

        {material.content_type === "document" && (
          <PdfPreview url={material.file_url} fileName={material.file_name_original} />
        )}
        {material.content_type === "audio" && (
          <AudioPreview url={material.file_url} fileName={material.file_name_original} sizeLabel={material.formatted_file_size} />
        )}
        {material.content_type === "video" && <VideoPreview material={material} />}

        {material.description && (
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Deskripsi & catatan</h3>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{material.description}</p>
          </section>
        )}

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-[11px] font-semibold uppercase text-slate-400">Diunggah</dt>
              <dd className="text-sm font-semibold text-slate-800">{formatDateTime(material.created_at)}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <div>
              <dt className="text-[11px] font-semibold uppercase text-slate-400">Berlaku sampai</dt>
              <dd className="text-sm font-semibold text-slate-800">
                {material.expires_at ? formatDateTime(material.expires_at) : "Tanpa batas waktu"}
              </dd>
            </div>
          </div>
        </dl>
      </div>
    </Dialog>
  );
}
