import { BookOpen, CalendarDays, Pencil, School, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Dialog } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { Alert } from "../../ui/alert";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { cn } from "../../../lib/utils";

/** Detail kelas: wali kelas, mapel dan guru pengampu, serta daftar siswa. Data diambil dari server saat dibuka. */
function ClassroomDetailBody({ classroom, canWrite, onAssign, onStudents }) {
  const detail = useApiQuery(`/admin/classrooms/${classroom.id}`, {
    params: { school_id: classroom.school_id },
    select: (body) => body.data,
  });

  if (detail.isLoading && !detail.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }
  if (detail.error) {
    return (
      <Alert variant="danger" title="Detail kelas gagal dimuat" action={<Button size="sm" variant="outline" onClick={detail.reload}>Coba lagi</Button>}>
        {detail.error}
      </Alert>
    );
  }

  const data = detail.data;
  const subjects = data.subject_assignments ?? [];
  const students = data.students ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Wali kelas</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {data.homeroom_teacher?.name ?? "Belum ditentukan"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Jumlah siswa</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{students.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mata pelajaran</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-indigo-700">{subjects.length}</p>
        </div>
      </div>

      <section className="space-y-3">
        <header className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BookOpen className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Mata pelajaran & guru pengampu
          </h3>
          {canWrite && (
            <Button size="sm" variant="outline" onClick={onAssign}>
              <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Atur mapel
            </Button>
          )}
        </header>
        {subjects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Belum ada mata pelajaran yang diplot di kelas ini.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {subjects.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-sm font-semibold text-slate-900">{item.course?.title ?? "Mata pelajaran"}</p>
                <p className="mt-0.5 text-xs text-slate-500">Pengampu {item.teacher?.name ?? "–"}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  {item.schedule_day ? `${item.schedule_day}, ${item.schedule_time ?? "–"}` : "Jadwal belum diatur"}
                  {item.room ? ` · ${item.room}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <header className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Daftar siswa ({students.length})
          </h3>
          {canWrite && (
            <Button size="sm" variant="outline" onClick={onStudents}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Kelola siswa
            </Button>
          )}
        </header>
        {students.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Belum ada siswa di kelas ini.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200">
            <ul className="divide-y divide-slate-100">
              {students.map((student, index) => (
                <li key={student.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-6 text-right text-xs tabular-nums text-slate-400">{index + 1}</span>
                    <span className="truncate text-sm font-medium text-slate-900">{student.name}</span>
                  </span>
                  <span className={cn("font-mono text-xs text-slate-500")}>{student.nomor_induk ?? student.nim_nip ?? "–"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

/** Dialog detail kelas. Tombol aksi menutup dialog lalu membuka modal yang sesuai. */
export function ClassroomProfileDialog({ open, onClose, classroom, canWrite, onEdit, onAssign, onStudents }) {
  if (!classroom) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Detail kelas"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {canWrite && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(classroom);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Ubah kelas
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-indigo-700 p-6 text-white shadow-lg shadow-brand-900/20">
          <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-xl">
              <School className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100">Rombongan belajar</p>
              <h2 className="truncate text-2xl font-bold tracking-tight">{classroom.name}</h2>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-100">
                <span className="font-mono">{classroom.code}</span>
                <span>{classroom.school?.name ?? "Sekolah"}</span>
                <span>Tahun ajaran {classroom.academic_year ?? "–"}</span>
              </p>
            </div>
          </div>
        </div>

        <ClassroomDetailBody classroom={classroom} canWrite={canWrite} onAssign={() => { onClose(); onAssign(classroom); }} onStudents={() => { onClose(); onStudents(classroom); }} />
      </div>
    </Dialog>
  );
}
