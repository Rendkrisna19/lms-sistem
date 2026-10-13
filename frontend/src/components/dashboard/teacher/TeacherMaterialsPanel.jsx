import { useMemo, useState } from "react";
import { FileText, Volume2, Video, Eye, Library } from "lucide-react";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { EmptyState } from "../../ui/empty-state";
import { Skeleton } from "../../ui/skeleton";
import { MaterialPreviewModal } from "../../modals/MaterialPreviewModal";
import { cn } from "../../../lib/utils";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "document", label: "PDF" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
];

const TYPE_META = {
  document: { label: "Dokumen PDF", icon: FileText, tone: "bg-red-50 text-red-600" },
  audio: { label: "Audio suara", icon: Volume2, tone: "bg-indigo-50 text-indigo-600" },
  video: { label: "Video", icon: Video, tone: "bg-blue-50 text-blue-600" },
};

/** Materi terbaru yang diunggah guru, dengan filter model media dan pratinjau langsung. */
export function TeacherMaterialsPanel() {
  const materials = useApiQuery("/teacher/materials", { select: (body) => body.data.materials ?? [] });
  const [filter, setFilter] = useState("all");
  const [preview, setPreview] = useState(null);

  const rows = useMemo(() => {
    const list = materials.data ?? [];
    return (filter === "all" ? list : list.filter((item) => item.content_type === filter)).slice(0, 6);
  }, [materials.data, filter]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Library className="h-5 w-5 text-brand-600" aria-hidden="true" />
            Bahan ajar terbaru
          </h2>
          <p className="text-xs text-slate-500">Materi dokumen, audio, dan video yang Anda unggah untuk kelas ajar.</p>
        </div>
        <div role="group" aria-label="Filter model media" className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
              className={cn(
                "h-7 rounded-full px-3 text-xs font-semibold transition-colors",
                filter === item.value ? "bg-brand-600 text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {materials.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Library} title="Belum ada bahan ajar" description="Unggah materi dari menu Bahan Ajar agar muncul di sini." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => {
            const meta = TYPE_META[item.content_type] ?? TYPE_META.document;
            const Icon = meta.icon;
            return (
              <li key={item.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", meta.tone)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.course?.title ?? "Mata pelajaran"} · {item.classroom?.name ?? "Semua kelas"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Badge variant={item.is_active ? "success" : "muted"}>{item.is_active ? "Tampil" : "Disembunyikan"}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setPreview(item)}>
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Pratinjau
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <MaterialPreviewModal isOpen={Boolean(preview)} onClose={() => setPreview(null)} material={preview} />
    </section>
  );
}
