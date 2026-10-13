import { useEffect } from "react";
import { X, GraduationCap, Award, TrendingUp, School, BarChart3, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { useApiQuery } from "../../hooks/useApiQuery";
import { percentLabel } from "../../features/admin/format";
import { toast } from "sonner";

/** Analitik murid & akademik satu sekolah (admin master). */
export function SchoolAnalyticsModal({ isOpen, onClose, school }) {
  const analytics = useApiQuery(isOpen && school?.id ? `/admin/schools/${school.id}/analytics` : null, {
    select: (body) => body.data ?? null,
  });
  const data = analytics.data;
  const isLoading = analytics.isLoading;

  useEffect(() => {
    if (analytics.error) toast.error("Gagal memuat analitik siswa untuk sekolah ini.");
  }, [analytics.error]);

  if (!isOpen || !school) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Analitik Murid & Akademik
                </h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                  {school.jenjang || "–"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {school.name} (NPSN: {school.npsn || "-"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : data ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-[11px] font-bold uppercase">Total Murid</span>
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {data.summary?.total_students ?? "–"}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">Terdaftar aktif</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-[11px] font-bold uppercase">Rerata Nilai</span>
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {data.summary?.average_exam_score ?? "–"}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">Skala 100 poin</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-[11px] font-bold uppercase">Kelulusan</span>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {percentLabel(data.summary?.pass_rate_percentage)}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">Ujian & Kuis</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100">
                  <div className="flex items-center justify-between text-blue-600 mb-1">
                    <span className="text-[11px] font-bold uppercase">Rombel Kelas</span>
                    <School className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {data.summary?.total_classrooms ?? "–"}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">{data.summary?.total_teachers ?? "–"} Guru pengampu</span>
                </div>
              </div>

              {/* Rombel & Student Distribution */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <School className="h-4 w-4 text-blue-600" />
                    Distribusi Murid per Kelas / Rombel
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    ID Sekolah: #{data.school?.id}
                  </span>
                </div>

                {data.classrooms && data.classrooms.length > 0 ? (
                  <div className="space-y-3">
                    {data.classrooms.map((c) => {
                      const totalStudents = data.summary?.total_students || 1;
                      const pct = Math.round((c.students_count / (totalStudents || 1)) * 100);
                      return (
                        <div key={c.id} className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                              {c.name} <span className="text-slate-400 font-normal">({c.code})</span>
                            </span>
                            <span className="font-mono text-blue-600">{c.students_count} Siswa ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Belum ada rombel kelas yang terdaftar untuk sekolah ini.
                  </div>
                )}
              </div>

              {/* Institutional Overview Note */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900">Isolasi Data Terverifikasi:</p>
                  Semua analitik, rekapitulasi nilai, guru, dan peserta didik di atas sepenuhnya terikat secara eksklusif dengan ID Sekolah{" "}
                  <strong>#{data.school?.id} ({data.school?.name})</strong>.
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              Data analitik sekolah tidak ditemukan.
            </div>
          )}

          {/* Close Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 cursor-pointer shadow-md shadow-blue-500/20"
            >
              Tutup Analitik
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
