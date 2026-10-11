import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  UploadCloud,
  FileText,
  Volume2,
  Video,
  Film,
  FolderOpen,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { api } from "../../lib/api";

export function UploadMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  assignedOptions = [],
  currentUser,
}) {
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("document"); // 'document' | 'audio' | 'video'
  const [videoSourceType, setVideoSourceType] = useState("upload"); // 'upload' | 'youtube' | 'google_drive'
  const [file, setFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setContentType("document");
      setVideoSourceType("upload");
      setFile(null);
      setExternalUrl("");
      setHasExpiry(false);
      setExpiresAt("");
      setIsActive(true);
      setIsSubmitting(false);
      setSelectedAssignmentIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAssignment = assignedOptions[selectedAssignmentIndex] || assignedOptions[0] || null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const fileSizeMb = selectedFile.size / (1024 * 1024);

    // Validasi Dokumen PDF (Maks 20MB)
    if (contentType === "document") {
      if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Format berkas harus berupa dokumen PDF (.pdf).");
        e.target.value = "";
        return;
      }
      if (fileSizeMb > 20) {
        toast.error(`Ukuran file PDF (${fileSizeMb.toFixed(1)} MB) melebihi batas maksimal 20 MB.`);
        e.target.value = "";
        return;
      }
    }

    // Validasi Audio Suara (Maks 20MB)
    if (contentType === "audio") {
      const allowedAudio = [".mp3", ".wav", ".m4a", ".ogg", ".aac"];
      const isValidExt = allowedAudio.some((ext) => selectedFile.name.toLowerCase().endsWith(ext));
      if (!isValidExt && !selectedFile.type.startsWith("audio/")) {
        toast.error("Format berkas audio harus berupa MP3, WAV, M4A, atau OGG.");
        e.target.value = "";
        return;
      }
      if (fileSizeMb > 20) {
        toast.error(`Ukuran file Audio (${fileSizeMb.toFixed(1)} MB) melebihi batas maksimal 20 MB.`);
        e.target.value = "";
        return;
      }
    }

    // Validasi Video Asli (Maks 100MB)
    if (contentType === "video" && videoSourceType === "upload") {
      const allowedVideo = [".mp4", ".webm", ".mov", ".mkv"];
      const isValidExt = allowedVideo.some((ext) => selectedFile.name.toLowerCase().endsWith(ext));
      if (!isValidExt && !selectedFile.type.startsWith("video/")) {
        toast.error("Format berkas video harus berupa MP4, WEBM, atau MOV.");
        e.target.value = "";
        return;
      }
      if (fileSizeMb > 100) {
        toast.error(`Ukuran video (${fileSizeMb.toFixed(1)} MB) melebihi batas maksimal 100 MB.`);
        e.target.value = "";
        return;
      }
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentAssignment) {
      toast.error("Anda belum memilih rombel kelas & mata pelajaran.");
      return;
    }

    if (!title.trim()) {
      toast.error("Judul modul atau bahan ajar wajib diisi.");
      return;
    }

    if (contentType === "document" && !file) {
      toast.error("Silakan pilih berkas PDF untuk diunggah (Maks. 20 MB).");
      return;
    }

    if (contentType === "audio" && !file) {
      toast.error("Silakan pilih berkas audio rekaman suara untuk diunggah (Maks. 20 MB).");
      return;
    }

    if (contentType === "video") {
      if (videoSourceType === "upload" && !file) {
        toast.error("Silakan pilih berkas video asli untuk diunggah.");
        return;
      }
      if ((videoSourceType === "youtube" || videoSourceType === "google_drive") && !externalUrl.trim()) {
        toast.error(`Tautan URL ${videoSourceType === "youtube" ? "YouTube" : "Google Drive"} wajib diisi.`);
        return;
      }
    }

    if (hasExpiry && !expiresAt) {
      toast.error("Silakan tentukan tanggal & waktu batas materi akan hilang.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("classroom_id", currentAssignment.classroom_id);
      formData.append("course_id", currentAssignment.course_id);
      if (currentUser?.id) {
        formData.append("teacher_id", currentUser.id);
      }
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("content_type", contentType);
      formData.append("is_active", isActive ? 1 : 0);

      if (hasExpiry && expiresAt) {
        formData.append("expires_at", expiresAt);
      }

      if (contentType === "document" || contentType === "audio") {
        if (file) {
          formData.append("file", file);
        }
      } else if (contentType === "video") {
        formData.append("video_source_type", videoSourceType);
        if (videoSourceType === "upload" && file) {
          formData.append("file", file);
        } else if (externalUrl) {
          formData.append("external_url", externalUrl.trim());
        }
      }

      const res = await api.post("/teacher/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status === "success") {
        toast.success(res.data.message || "Bahan ajar berhasil diunggah!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.data?.message || "Gagal mengunggah bahan ajar.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Terjadi kesalahan saat mengunggah berkas.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 my-8 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full p-1.5 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Unggah Bahan Ajar & Modul Baru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Disesuaikan khusus untuk rombongan belajar kelas dan mata pelajaran yang Anda ampu.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Pilih Floating Rombel & Mapel */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Target Kelas & Mata Pelajaran (Floating Mapel) <span className="text-red-500">*</span>
            </label>
            {assignedOptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assignedOptions.map((opt, idx) => (
                  <button
                    key={`${opt.classroom_id}-${opt.course_id}-${idx}`}
                    type="button"
                    onClick={() => setSelectedAssignmentIndex(idx)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedAssignmentIndex === idx
                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">
                        {opt.classroom_name} ({opt.classroom_code})
                      </span>
                      {selectedAssignmentIndex === idx && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                      {opt.course_title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs">
                Belum ada plotting kelas & mapel aktif yang ditugaskan ke akun Anda.
              </div>
            )}
          </div>

          {/* 2. Judul Modul */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Judul Modul / Bahan Ajar <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Modul 02: Normalisasi Basis Data 1NF sampai 3NF"
              className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 3. Deskripsi Materi */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Deskripsi / Ringkasan Pembelajaran
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ringkasan isi materi atau instruksi belajar bagi siswa..."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* 4. Format Media (3 Model) */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Format Model Pembelajaran (3 Model) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setContentType("document");
                  setFile(null);
                }}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  contentType === "document"
                    ? "bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Dokumen PDF</span>
                <span className="text-[10px] font-normal text-slate-500">Maks. 20 MB</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setContentType("audio");
                  setFile(null);
                }}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  contentType === "audio"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Volume2 className="h-5 w-5" />
                <span>Audio Podcast</span>
                <span className="text-[10px] font-normal text-slate-500">Maks. 20 MB</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setContentType("video");
                  setFile(null);
                }}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  contentType === "video"
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20 shadow-xs"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Video className="h-5 w-5" />
                <span>Video Visual</span>
                <span className="text-[10px] font-normal text-slate-500">Asli / YT / Drive</span>
              </button>
            </div>
          </div>

          {/* 5. Detail Input Spesifik Berdasarkan Format Media */}
          {contentType === "document" && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Pilih Berkas PDF (.pdf)</span>
                <span className="text-[11px] text-slate-500">Maksimal 20 MB</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-slate-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          )}

          {contentType === "audio" && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Pilih Berkas Audio Suara (.mp3, .wav, .m4a, .ogg)</span>
                <span className="text-[11px] text-slate-500">Maksimal 20 MB</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                />
              </div>
              {file && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-slate-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          )}

          {contentType === "video" && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>Pilih Sumber Video:</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVideoSourceType("upload")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    videoSourceType === "upload"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload Video Asli</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoSourceType("youtube")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    videoSourceType === "youtube"
                      ? "bg-red-600 text-white border-red-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  <span>Link YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVideoSourceType("google_drive")}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    videoSourceType === "google_drive"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Link G-Drive</span>
                </button>
              </div>

              {videoSourceType === "upload" && (
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-semibold text-slate-700 block">
                    Upload Berkas Video Asli (.mp4, .webm, .mov)
                  </label>
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  {file && (
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-slate-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              )}

              {videoSourceType === "youtube" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Film className="h-3.5 w-3.5 text-red-600" />
                    <span>Masukkan Tautan Video YouTube</span>
                  </label>
                  <Input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="h-9 rounded-xl border-slate-200 text-xs font-mono"
                  />
                </div>
              )}

              {videoSourceType === "google_drive" && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <FolderOpen className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Masukkan Tautan Video Google Drive (Pastikan Akses Publik/Viewer)</span>
                  </label>
                  <Input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view"
                    className="h-9 rounded-xl border-slate-200 text-xs font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. Pengaturan Tanggal Kapan Materi Akan Hilang / Kadaluarsa */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Batas Waktu Akses / Kapan Materi Akan Hilang
                </span>
                <span className="text-[11px] text-slate-500">
                  Atur masa berlaku materi agar otomatis nonaktif setelah tanggal tertentu.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExpiry}
                  onChange={(e) => setHasExpiry(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {hasExpiry && (
              <div className="pt-2 border-t border-slate-200/80 animate-in fade-in duration-200">
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Pilih Tanggal & Waktu Materi Berakhir (Kadaluarsa)
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="h-9 rounded-xl border-slate-200 text-xs w-full sm:w-72"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Materi akan otomatis tersembunyi dari akun siswa setelah waktu ini tercapai.
                </p>
              </div>
            )}
          </div>

          {/* 7. Pengaturan Status Awal (Aktif / Nonaktif) */}
          <div className="flex items-center justify-between px-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Status Bahan Ajar
              </span>
              <span className="text-[11px] text-slate-500">
                {isActive ? "Materi langsung aktif dan dapat diakses siswa" : "Materi disimpan sebagai draf nonaktif"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl text-xs px-4 cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 shadow-sm cursor-pointer gap-2"
            >
              <UploadCloud className="h-4 w-4" />
              {isSubmitting ? "Mengunggah Berkas..." : "Unggah Bahan Ajar"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
