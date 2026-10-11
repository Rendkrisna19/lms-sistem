import React, { useState, useEffect } from "react";
import { Award, Download, CheckCircle, AlertCircle, Search, Calendar, Filter, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { CustomSelect } from "../components/ui/custom-select";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export function GradesPage({ currentUser }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [search, setSearch] = useState("");
  const [gradesList, setGradesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGrades = async () => {
    try {
      setIsLoading(true);
      const url = currentUser?.role === "guru"
        ? `/teacher/grades?teacher_id=${currentUser?.id || ""}`
        : "/teacher/grades";
      const res = await api.get(url);
      if (res.data?.status === "success") {
        setGradesList(res.data.data);
      }
    } catch (e) {
      console.warn("Could not load /teacher/grades, using default list:", e);
      setGradesList([
        { id: 1, nis: "20241001", name: "Siswa Belajar (Ahmad Fajar)", email: "siswa@gmail.com", kelas: "Teknik Informatika - A", status: "Lulus", nilai: 95, submitTime: "13:30, 10 Okt 2026" },
        { id: 2, nis: "20241002", name: "Siti Aisyah", email: "siti@cendekia.ac.id", kelas: "Teknik Informatika - A", status: "Lulus", nilai: 88, submitTime: "14:40, 10 Okt 2026" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [currentUser?.id, currentUser?.role]);

  const handleExportCSV = () => {
    toast.success("Mengunduh rekap nilai format .CSV...");
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "NO,NIS,NAMA SISWA,KELAS,NILAI,STATUS,WAKTU SUBMIT\n" +
      gradesList
        .map(
          (s, idx) =>
            `${idx + 1},${s.nis},"${s.name}","${s.kelas}",${s.nilai},${s.status},"${s.submitTime}"`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rekap_nilai_cendekia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Extract unique classes for filter dropdown
  const availableClasses = Array.from(new Set(gradesList.map((g) => g.kelas).filter(Boolean)));

  const filtered = gradesList.filter((s) => {
    const matchStatus = filterStatus === "all" || s.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchClass = filterClass === "all" || s.kelas === filterClass;
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.nis?.includes(search) ||
      s.kelas?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchClass && matchSearch;
  });

  // Calculate dynamic metrics
  const totalCount = gradesList.length;
  const avgScore = totalCount > 0 ? (gradesList.reduce((acc, g) => acc + (Number(g.nilai) || 0), 0) / totalCount).toFixed(1) : 0;
  const passedCount = gradesList.filter((g) => g.status === "Lulus").length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const topStudent = gradesList.length > 0 ? gradesList.reduce((max, g) => (g.nilai > max.nilai ? g : max), gradesList[0]) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Rekapitulasi Nilai & Kelulusan Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser?.role === "guru"
              ? `Penilaian evaluasi murid khusus rombel ajar ${currentUser?.name || "Guru Pengampu"}`
              : "Data penilaian evaluasi ujian kuis seluruh rombel peserta didik"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchGrades}
            variant="outline"
            className="rounded-full border-slate-200 text-xs px-3 py-2 cursor-pointer"
            title="Muat Ulang"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={handleExportCSV}
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Unduh Rekap .CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-5">
          <p className="text-xs font-semibold text-slate-400">Rata-Rata Nilai</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{avgScore} / 100</h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Dari {totalCount} peserta evaluasi</p>
        </Card>
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-5">
          <p className="text-xs font-semibold text-slate-400">Tingkat Kelulusan</p>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{passRate}% Lulus</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{passedCount} dari {totalCount} siswa mencapai passing score</p>
        </Card>
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-5">
          <p className="text-xs font-semibold text-slate-400">Nilai Tertinggi</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
            {topStudent ? `${topStudent.nilai} Poin` : "-"}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
            {topStudent ? `${topStudent.name} • ${topStudent.kelas}` : "Belum ada nilai"}
          </p>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari siswa atau NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 text-xs rounded-xl border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            {availableClasses.length > 1 && (
              <div className="w-48">
                <CustomSelect
                  value={filterClass}
                  onChange={(val) => setFilterClass(val)}
                  options={[
                    { value: "all", label: "Semua Rombel" },
                    ...availableClasses.map((cls) => ({ value: cls, label: cls })),
                  ]}
                  placeholder="Filter Rombel"
                  className="py-1.5 rounded-full bg-slate-100 border-none hover:bg-slate-200/60"
                />
              </div>
            )}

            <div className="w-40">
              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val)}
                options={[
                  { value: "all", label: "Semua Status" },
                  { value: "lulus", label: "Lulus Saja" },
                  { value: "remedial", label: "Remedial Saja" },
                ]}
                placeholder="Filter Status"
                className="py-1.5 rounded-full bg-slate-100 border-none hover:bg-slate-200/60"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Nama & Identitas</th>
                <th className="py-3 px-4">Kelas / Rombel</th>
                <th className="py-3 px-4">Waktu Submit</th>
                <th className="py-3 px-4 text-center">Nilai Skor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Belum ada data evaluasi yang sesuai dengan pencarian atau filter rombel ini.
                  </td>
                </tr>
              ) :
                filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl bg-blue-50 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{s.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">NIS: {s.nis}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{s.kelas}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{s.submitTime}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-extrabold text-sm text-slate-900">{s.nilai}</span>
                    <span className="text-slate-400 text-xs"> / 100</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full",
                        s.status === "Lulus"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}
                    >
                      {s.status === "Lulus" ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.info(`Detail hasil ujian ${s.name} (${s.nilai}/100)`)}
                      className="px-3 py-1 rounded-xl text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
