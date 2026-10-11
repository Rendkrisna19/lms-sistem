import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES } from "../../../features/quiz/useImageUpload";
import { cn } from "../../../lib/utils";

/**
 * Gambar terlampir (mis. gambar pilihan jawaban). Mendukung unggah, ganti, dan hapus.
 * `onUpload(file)` harus mengembalikan URL atau null.
 */
export function ImageAttachment({ url, onChange, onUpload, label = "gambar", className, size = "md" }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    const uploaded = await onUpload(file);
    setIsUploading(false);
    if (uploaded) onChange(uploaded);
  };

  const input = (
    <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" tabIndex={-1} onChange={handleFile} />
  );

  if (!url) {
    return (
      <>
        <button
          type="button"
          onClick={pick}
          disabled={isUploading}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2.5 h-8 text-xs font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/50 transition-colors disabled:opacity-60",
            className
          )}
          aria-label={`Tambah ${label}`}
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
          {isUploading ? "Mengunggah..." : "Gambar"}
        </button>
        {input}
      </>
    );
  }

  return (
    <div className={cn("group/image relative inline-block rounded-xl border border-slate-200 bg-slate-50 p-1.5", className)}>
      <img
        src={url}
        alt={`Pratinjau ${label}`}
        className={cn("rounded-lg object-contain bg-white", size === "sm" ? "max-h-24 max-w-[180px]" : "max-h-48 max-w-full sm:max-w-sm")}
        loading="lazy"
      />
      {isUploading && (
        <div className="absolute inset-0 rounded-xl bg-white/70 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-label="Mengunggah" />
        </div>
      )}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover/image:opacity-100 sm:group-focus-within/image:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={pick}
          className="h-7 w-7 rounded-lg bg-white/95 shadow border border-slate-200 flex items-center justify-center text-slate-600 hover:text-brand-700"
          aria-label={`Ganti ${label}`}
          title="Ganti gambar"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChange("")}
          className="h-7 w-7 rounded-lg bg-white/95 shadow border border-slate-200 flex items-center justify-center text-red-500 hover:text-red-700"
          aria-label={`Hapus ${label}`}
          title="Hapus gambar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {input}
    </div>
  );
}
