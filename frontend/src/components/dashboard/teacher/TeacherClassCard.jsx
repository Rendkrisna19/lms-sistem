import { CalendarDays, DoorOpen, Users } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Card } from "../../ui/card";

/** Kartu satu rombel ajar: mapel yang diampu guru di kelas itu, jadwal, ruang, dan daftar murid. */
export function TeacherClassCard({ classroom, subjects, students }) {
  const studentCount = classroom.students_count ?? students.length;

  return (
    <Card className="space-y-4 rounded-3xl border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-brand-300">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">{classroom.name}</h3>
            <Badge className="rounded-lg bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">{classroom.code}</Badge>
          </div>
          {classroom.academic_year && <p className="mt-0.5 text-xs text-slate-400">Tahun ajaran {classroom.academic_year}</p>}
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{studentCount} siswa</span>
      </div>

      {subjects.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">Belum ada mapel yang Anda ampu di kelas ini.</p>
      ) : (
        <ul className="space-y-2">
          {subjects.map((subject) => (
            <li key={subject.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3.5">
              <p className="text-sm font-bold text-slate-900">{subject.course?.title ?? "Mata pelajaran"}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  {subject.schedule_day ? `${subject.schedule_day}, ${subject.schedule_time ?? "–"}` : "Jadwal belum diatur"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  {subject.room ?? "Ruang belum diatur"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Users className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
          Murid di kelas ini ({students.length})
        </p>
        {students.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada murid terdaftar.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {students.map((student) => (
              <li key={student.id} className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2 text-xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                  {student.name?.charAt(0) ?? "?"}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold leading-tight text-slate-900">{student.name}</p>
                  <p className="font-mono text-[10px] text-slate-400">NIS {student.nis ?? "-"}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
