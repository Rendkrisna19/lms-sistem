import { AlertCircle, Download, ExternalLink, FileText, Volume2 } from "lucide-react";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";
import { getDrivePreviewUrl, getYoutubeEmbedUrl } from "../../lib/mediaUrls";

/** Pratinjau PDF langsung di dalam halaman, tanpa harus mengunduh dulu. */
export function PdfPreview({ url, fileName }) {
  if (!url) {
    return <Unavailable message="Berkas PDF belum tersedia di server." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700">
          <FileText className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <span className="truncate">{fileName || "Dokumen PDF"}</span>
        </span>
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Buka di tab baru
          </a>
          <a href={url} download={fileName || true} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Unduh
          </a>
        </div>
      </div>
      <iframe
        src={`${url}#view=FitH`}
        title={fileName || "Pratinjau dokumen"}
        className="h-[68vh] w-full bg-white"
      />
    </div>
  );
}

/** Pemutar audio dengan kartu judul di atasnya. */
export function AudioPreview({ url, fileName, sizeLabel }) {
  if (!url) {
    return <Unavailable message="Rekaman audio belum diunggah atau tidak tersedia di server." />;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{fileName || "Rekaman audio"}</p>
          {sizeLabel && <p className="text-xs text-slate-500">{sizeLabel}</p>}
        </div>
      </div>
      <audio controls preload="metadata" className="w-full">
        <source src={url} />
        Browser Anda tidak mendukung elemen audio.
      </audio>
    </div>
  );
}

/** Pemutar video: YouTube, Google Drive, atau berkas video yang diunggah. */
export function VideoPreview({ material }) {
  const youtube = material.video_source_type === "youtube" ? getYoutubeEmbedUrl(material.external_url) : null;
  const drive = material.video_source_type === "google_drive" ? getDrivePreviewUrl(material.external_url) : null;

  if (youtube) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-black">
        <iframe src={youtube} title={material.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full border-0" />
      </div>
    );
  }

  if (drive) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-slate-900">
        <iframe src={drive} title={material.title} allow="autoplay" className="h-full w-full border-0" />
      </div>
    );
  }

  if (material.file_url) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl bg-black">
        <video controls preload="metadata" className="h-full w-full object-contain">
          <source src={material.file_url} />
          Browser Anda tidak mendukung pemutar video HTML5.
        </video>
      </div>
    );
  }

  return <Unavailable message="Video tidak dapat dimuat. Periksa tautan atau berkas video." />;
}

function Unavailable({ message }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
