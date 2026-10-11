import { Calendar, Clock, MapPin, User } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { PageHeader } from "../../components/ui/page-header";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { Skeleton } from "../../components/ui/skeleton";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function StudentSchedulePage() {
  const { data, error, isLoading, reload } = useApiQuery("/student/schedule");
  const schedule = data?.schedule ?? [];
  const grouped = DAYS.map((day) => ({ day, items: schedule.filter((item) => item.schedule_day === day) })).filter((g) => g.items.length);
  const unscheduled = schedule.filter((item) => !DAYS.includes(item.schedule_day));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Pelajaran"
        description={data?.classroom ? `Jadwal mingguan kelas ${data.classroom.name} (${data.classroom.code}).` : "Jadwal mingguan kelas Anda."}
      />

      {error && (
        <Alert variant="danger" title="Gagal memuat jadwal" action={<Button size="sm" variant="outline" onClick={reload}>Coba lagi</Button>}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : !data?.classroom ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState icon={Calendar} title="Anda belum terdaftar di kelas" description="Hubungi admin sekolah agar akun Anda dimasukkan ke rombongan belajar." />
        </div>
      ) : schedule.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState icon={Calendar} title="Jadwal belum tersedia" description="Admin sekolah belum mengatur jadwal mata pelajaran untuk kelas Anda." />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...grouped, ...(unscheduled.length ? [{ day: "Tanpa Hari", items: unscheduled }] : [])].map((group) => (
            <section key={group.day} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {group.day}
              </h2>
              <ul className="mt-3 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <p className="text-sm font-semibold text-slate-900">{item.course_title}</p>
                    <div className="mt-1.5 grid gap-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{item.schedule_time || "-"}</span>
                      <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" aria-hidden="true" />{item.teacher_name || "-"}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{item.room || "-"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
