import { useMemo, useState } from "react";
import { Building2, RefreshCw, Search } from "lucide-react";
import { useApiQuery } from "../hooks/useApiQuery";
import { learningAnalyticsUrl } from "../features/analytics/endpoints";
import { MEDIA_FILTER_OPTIONS, filterStudents } from "../features/analytics/filters";
import { ROLES } from "../lib/navigation";
import { PageHeader } from "../components/ui/page-header";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { CustomSelect } from "../components/ui/custom-select";
import { Alert } from "../components/ui/alert";
import { AnalyticsSummary } from "../components/analytics/AnalyticsSummary";
import { StudentActivityTable } from "../components/analytics/StudentActivityTable";

const EMPTY_SUMMARY = { total_students_analyzed: 0, total_media_interactions: 0 };

/** Statistik keaktifan siswa: master (seluruh sistem), admin sekolah (sekolahnya), dan guru (kelas ajarnya). */
export function StatsPage({ currentUser }) {
  const role = currentUser?.role;
  const isMaster = role === ROLES.ADMIN_MASTER;
  const isTeacher = role === ROLES.TEACHER;

  const [schoolId, setSchoolId] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [search, setSearch] = useState("");

  const url = learningAnalyticsUrl(role);
  const analytics = useApiQuery(url, {
    enabled: Boolean(url),
    params: isMaster && schoolId !== "all" ? { school_id: schoolId } : undefined,
    select: (body) => body.data,
  });

  const schools = useApiQuery(isMaster ? "/admin/schools" : null, { select: (body) => body.data ?? [] });

  const schoolOptions = useMemo(
    () => [{ value: "all", label: "Semua sekolah" }, ...(schools.data ?? []).map((school) => ({ value: String(school.id), label: school.name }))],
    [schools.data]
  );

  const students = useMemo(() => analytics.data?.students ?? [], [analytics.data]);
  const summary = analytics.data?.summary ?? EMPTY_SUMMARY;
  const filtered = useMemo(() => filterStudents(students, { search, media: mediaFilter }), [students, search, mediaFilter]);
  const isFiltered = Boolean(search.trim()) || mediaFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title={isTeacher ? "Keaktifan Belajar Siswa" : "Statistik Keaktifan Siswa"}
        description={
          isTeacher
            ? "Pemanfaatan media pembelajaran oleh siswa di kelas yang Anda ajar."
            : "Preferensi belajar siswa berdasarkan akses materi dokumen, audio, dan video."
        }
        actions={
          <Button variant="outline" size="sm" onClick={analytics.reload} disabled={analytics.isLoading}>
            <RefreshCw className={analytics.isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Segarkan
          </Button>
        }
      />

      {analytics.error && (
        <Alert variant="danger" title="Gagal memuat statistik" action={<Button size="sm" variant="outline" onClick={analytics.reload}>Coba lagi</Button>}>
          {analytics.error}
        </Alert>
      )}

      <AnalyticsSummary summary={summary} isLoading={analytics.isLoading} />

      <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, NIS, atau kelas"
                aria-label="Cari siswa"
                className="h-10 w-full rounded-xl pl-9"
              />
            </div>
            {isMaster && (
              <div className="w-full sm:w-56">
                <CustomSelect value={schoolId} onChange={setSchoolId} options={schoolOptions} placeholder="Filter sekolah" icon={Building2} />
              </div>
            )}
            <div className="w-full sm:w-52">
              <CustomSelect value={mediaFilter} onChange={setMediaFilter} options={MEDIA_FILTER_OPTIONS} placeholder="Model media" searchable={false} />
            </div>
          </div>
          <span className="shrink-0 text-xs text-slate-500">
            Menampilkan <strong className="text-slate-800">{filtered.length}</strong> dari {students.length} siswa
          </span>
        </div>

        <StudentActivityTable students={filtered} isLoading={analytics.isLoading} isFiltered={isFiltered} />
      </Card>
    </div>
  );
}
