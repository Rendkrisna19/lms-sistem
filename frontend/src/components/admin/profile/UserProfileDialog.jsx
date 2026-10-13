import { CalendarDays, GraduationCap, HeartHandshake, IdCard, MapPin, Pencil, Phone, School, UserRound } from "lucide-react";
import { Dialog } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { ageFrom, formatBirthDate, genderLabel } from "../../../features/admin/profile";
import { formatDateTime } from "../../../lib/datetime";
import { cn } from "../../../lib/utils";

const dash = "–";

/** Satu pasang label dan nilai pada kartu detail. */
function Fact({ label, value, wide = false }) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-900">{value || dash}</dd>
    </div>
  );
}

/** Kartu bagian: ikon, judul, dan isi berupa daftar fakta. */
function SectionCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </header>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

/** Pita ringkas berisi lencana status, mis. kelas atau jumlah mapel. */
function Chip({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-white/15 text-white ring-white/25",
    gold: "bg-amber-300/25 text-amber-50 ring-amber-200/40",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 backdrop-blur", tones[tone])}>{children}</span>;
}

/**
 * Detail lengkap guru atau siswa dalam mode baca. Tombol ubah membuka form yang sama dengan tombol edit di tabel.
 */
export function UserProfileDialog({ open, onClose, user, role, onEdit, canWrite }) {
  if (!user) return null;
  const isTeacher = role === "guru";
  const age = ageFrom(user.birth_date);
  const identifier = user.nomor_induk ?? user.nim_nip;
  const initial = user.name?.trim().charAt(0).toUpperCase() || "?";
  const birthPlace = [user.birth_place, user.birth_date ? formatBirthDate(user.birth_date) : null].filter(Boolean).join(", ");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Profil"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {canWrite && onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(user);
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-100">{isTeacher ? "Guru" : "Siswa"}</p>
              <h2 className="truncate text-2xl font-bold tracking-tight">{user.name}</h2>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brand-100">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  <IdCard className="h-3.5 w-3.5" aria-hidden="true" />
                  {isTeacher ? "NIP" : "NIS"} {identifier ?? dash}
                </span>
                {user.email && <span className="truncate">{user.email}</span>}
              </p>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2">
            {isTeacher ? (
              <Chip tone="gold">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                {user.teaching_assignments_count ?? 0} mapel diampu
              </Chip>
            ) : (
              <Chip>
                <School className="h-3.5 w-3.5" aria-hidden="true" />
                {user.classroom ? `Kelas ${user.classroom.name}` : "Belum ada kelas"}
              </Chip>
            )}
            {user.gender && (
              <Chip>
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                {genderLabel(user.gender)}
              </Chip>
            )}
            {age !== null && (
              <Chip>
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {age} tahun
              </Chip>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionCard icon={UserRound} title="Data pribadi">
            <Fact label="Tempat & tanggal lahir" value={birthPlace} />
            <Fact label="Jenis kelamin" value={genderLabel(user.gender)} />
          </SectionCard>

          <SectionCard icon={Phone} title="Kontak & alamat">
            <Fact label="No. telepon" value={user.phone} />
            <Fact label="Kota / kabupaten" value={user.city} />
            <Fact label="Alamat lengkap" value={user.address} wide />
          </SectionCard>

          {isTeacher ? (
            <SectionCard icon={GraduationCap} title="Pendidikan & kepegawaian">
              <Fact label="Pendidikan terakhir" value={user.education_level} />
              <Fact label="Jurusan / program studi" value={user.education_major} />
              <Fact label="Status kepegawaian" value={user.employment_status} />
              <Fact label="Tanggal bergabung" value={user.join_date ? formatBirthDate(user.join_date) : null} />
            </SectionCard>
          ) : (
            <>
              <SectionCard icon={School} title="Akademik & asal sekolah">
                <Fact label="Tahun masuk" value={user.admission_year} />
                <Fact label="Asal sekolah" value={user.previous_school} />
              </SectionCard>
              <SectionCard icon={HeartHandshake} title="Orang tua / wali">
                <Fact label="Nama" value={user.parent_name} />
                <Fact label="No. HP" value={user.parent_phone} />
                <Fact label="Pekerjaan" value={user.parent_job} wide />
              </SectionCard>
            </>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          Terdaftar {formatDateTime(user.created_at)}
        </p>
      </div>
    </Dialog>
  );
}
