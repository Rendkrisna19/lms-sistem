
import React from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  Volume2,
  Video,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  School,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export function MaterialPreviewModal({ isOpen, onClose, material }) {
  if (!isOpen || !material) return null;

  const isExpired = material.is_expired;
  const isPdf = material.content_type === "document";
  const isAudio = material.content_type === "audio";
  const isVideo = material.content_type === "video";

  // Helper to extract YouTube ID
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : null;
  };

  const getDriveEmbedUrl = (url) => {
    if (!url) return null;
    // convert view link to preview link for Google Drive
    return url.replace(/\/view(\?.*)?$/, "/preview");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 my-8 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full p-1.5 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
              isPdf
                ? "bg-red-50 text-red-600 border-red-100"
                : isAudio
                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                : "bg-blue-50 text-blue-600 border-blue-100"
            }`}
          >
            {isPdf && <FileText className="h-5 w-5" />}
            {isAudio && <Volume2 className="h-5 w-5" />}
            {isVideo && <Video className="h-5 w-5" />}
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isPdf
                    ? "bg-red-50 text-red-700 border-red-200"
                    : isAudio
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                {isPdf ? "Dokumen PDF" : isAudio ? "Audio Podcast" : "Video Pembelajaran"}
              </Badge>

              <Badge
                variant="outline"
                className={`text-[11px] font-semibold ${
                  material.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {material.is_active ? "Status: Aktif" : "Status: Nonaktif"}
              </Badge>

              {isExpired && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[11px] font-semibold">
                  Kadaluarsa
                </Badge>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 leading-snug">
              {material.title}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {material.classroom?.name} ({material.classroom?.code}) • {material.course?.title}
            </p>
          </div>
        </div>

        {/* Content Preview Container */}
        <div className="mt-5 space-y-4">
          {/* PDF Preview / Download */}
          {isPdf && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-red-100/60 text-red-600 mx-auto flex items-center justify-center">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {material.file_name_original || "Dokumen Materi Pembelajaran PDF"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ukuran Berkas: {material.formatted_file_size || "Format PDF Standar (Maks. 20 MB)"}
                </p>
              </div>

              {material.file_url ? (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Berkas PDF
                  </a>
                  <a
                    href={material.file_url}
                    download={material.file_name_original || "modul_materi.pdf"}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Unduh PDF
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Tautan berkas PDF belum diunggah.</p>
              )}
            </div>
          )}

          {/* Audio Player Preview */}
          {isAudio && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border border-indigo-100 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Volume2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {material.file_name_original || "Rekaman Podcast Penjelasan Dosen"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Audio Materi Vokal • Ukuran: {material.formatted_file_size || "Maks. 20 MB"}
                  </p>
                </div>
              </div>

              {material.file_url ? (
                <div className="pt-2">
                  <audio controls className="w-full rounded-xl">
                    <source src={material.file_url} />
                    Browser Anda tidak mendukung elemen audio.
                  </audio>
                </div>
              ) : (
                <div className="p-3 bg-indigo-50/70 rounded-xl text-xs text-indigo-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Berkas rekaman suara belum diunggah atau tidak tersedia di server.</span>
                </div>
              )}
            </div>
          )}

          {/* Video Player Preview */}
          {isVideo && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-black">
              {material.video_source_type === "youtube" && getYoutubeEmbedUrl(material.external_url) ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={getYoutubeEmbedUrl(material.external_url)}
                    title={material.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : material.video_source_type === "google_drive" && material.external_url ? (
                <div className="aspect-video w-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
                  <ExternalLink className="h-10 w-10 text-emerald-400 mb-3" />
                  <h4 className="font-bold text-sm mb-1">Video Google Drive</h4>
                  <p className="text-xs text-slate-300 max-w-md mb-4">
                    Video tersimpan di Google Drive. Klik tombol di bawah untuk membuka video di tab baru.
                  </p>
                  <a
                    href={material.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                  >
                    Buka Video di Google Drive
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ) : material.file_url ? (
                <div className="aspect-video w-full">
                  <video controls className="w-full h-full object-contain">
                    <source src={material.file_url} />
                    Browser Anda tidak mendukung pemutar video HTML5.
                  </video>
                </div>
              ) : (
                <div className="aspect-video w-full bg-slate-900 flex items-center justify-center text-slate-400 text-xs">
                  Video tidak dapat dimuat.
                </div>
              )}
            </div>
          )}

          {/* Deskripsi Materi */}
          {material.description && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Deskripsi & Catatan Pembelajaran
              </span>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {material.description}
              </p>
            </div>
          )}

          {/* Meta Detail Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tanggal Upload</span>
                <span className="font-semibold text-slate-800">
                  {new Date(material.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })} WIB
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Batas Waktu / Hilang</span>
                <span className={`font-semibold ${isExpired ? "text-red-600 font-bold" : "text-slate-800"}`}>
                  {material.expires_at
                    ? new Date(material.expires_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) + " WIB"
                    : "Aktif Selamanya (Tanpa Batas)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs px-5 cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
