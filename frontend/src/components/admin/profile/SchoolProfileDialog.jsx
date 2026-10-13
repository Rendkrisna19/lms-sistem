import { BarChart3, Building2, Mail, MapPin, Pencil, Phone, ShieldCheck } from "lucide-react";
import { Dialog } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { formatDateTime } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";

const dash = "–";

/** Satu pasang label dan nilai dalam kartu detail. */
function Fact({ label, value, wide = false }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-900">{value || dash}</dd>
    </div>
  );
}

/** Kartu ringkasan angka: jumlah guru, siswa, kelas, dan mapel. */
function CountTile({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", tone)}>{value ?? 0}</p>
    </div>
  );
}

/** Detail lengkap sekolah dalam mode baca. Tombol ubah membuka form edit yang sama dengan tabel. */
export function SchoolProfileDialog({ open, onClose, school, onEdit, onAnalytics }) {
  if (!school) return null;
  const active = school.status === "active";
  const initial = school.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Profil sekolah"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {onAnalytics && (
            <Button variant="outline" onClick={() => onAnalytics(school)}>
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              Analitik
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(school);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Ubah data
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-indigo-700 p-6 text-white shadow-lg shadow-brand-900/20 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-black text-brand-700 shadow-xl ring-4 ring-white/25">
              {initial}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100">Sekolah mitra</p>
              <h2 className="truncate text-2xl font-bold tracking-tight">{school.name}</h2>
              <p className="font-mono text-sm text-brand-100">NPSN {school.npsn ?? dash}</p>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">{school.jenjang ?? dash}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                active ? "bg-emerald-300/25 text-emerald-50 ring-emerald-200/40" : "bg-slate-300/25 text-slate-100 ring-slate-200/40"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-300" : "bg-slate-300")} aria-hidden="true" />
              {active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CountTile label="Guru" value={school.teachers_count} tone="text-brand-700" />
          <CountTile label="Siswa" value={school.students_count} tone="text-emerald-700" />
          <CountTile label="Kelas" value={school.classrooms_count} tone="text-indigo-700" />
          <CountTile label="Mata pelajaran" value={school.courses_count} tone="text-amber-700" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <header className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">Identitas & kontak</h3>
            </header>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Fact label="Alamat" value={school.address} wide />
              <Fact label="Telepon" value={school.phone} />
              <Fact label="Email" value={school.email} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <header className="mb-4 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">Admin sekolah</h3>
            </header>
            {school.admin ? (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Fact label="Nama" value={school.admin.name} />
                <Fact label="NIP / ID" value={school.admin.nomor_induk} />
                <Fact label="Email login" value={school.admin.email} wide />
              </dl>
            ) : (
              <p className="text-sm text-slate-500">Belum ada admin sekolah yang ditautkan.</p>
            )}
          </section>
        </div>

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" aria-hidden="true" />{school.email ?? dash}</span>
          <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" aria-hidden="true" />{school.phone ?? dash}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" aria-hidden="true" />Terdaftar {formatDateTime(school.created_at)}</span>
        </p>
      </div>
    </Dialog>
  );
}
