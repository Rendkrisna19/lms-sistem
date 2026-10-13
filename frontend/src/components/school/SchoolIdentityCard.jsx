import { Building2, Mail, MapPin, Phone } from "lucide-react";
import { useApiQuery } from "../../hooks/useApiQuery";
import { Skeleton } from "../ui/skeleton";

/**
 * Banner utama dashboard admin sekolah: judul halaman dan identitas sekolah (logo, NPSN, akreditasi,
 * alamat, kontak, jumlah guru dan siswa) dalam satu latar biru. Data diambil dari profil sekolah.
 */
export function SchoolIdentityCard({ eyebrow, title, description, actions }) {
  const school = useApiQuery("/admin/school", { select: (body) => body.data });
  const data = school.data;

  if (school.isLoading && !data) {
    return <Skeleton className="h-56 rounded-3xl" />;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-500/10 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg ring-4 ring-white/20">
            {data?.logo_url ? (
              <img src={data.logo_url} alt={`Logo ${data.name}`} className="max-h-full max-w-full object-contain" />
            ) : (
              <Building2 className="h-9 w-9 text-slate-300" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0 space-y-3">
            {eyebrow && (
              <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/25">{eyebrow}</span>
            )}
            <div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h1>
              {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100">{description}</p>}
            </div>

            {data && (
              <div className="space-y-2 text-sm text-blue-50">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-blue-100">NPSN {data.npsn ?? "–"}</span>
                  {data.jenjang && <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-bold">{data.jenjang}</span>}
                  <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold">
                    Akreditasi {data.accreditation ?? "belum diisi"}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs text-blue-100 md:grid-cols-2">
                  <span className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {data.address ?? "Alamat belum diisi"}
                  </span>
                  <span className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{data.phone ?? "Telepon belum diisi"}</span>
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{data.email ?? "Email belum diisi"}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
          {data && (
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-[88px] rounded-2xl bg-white/12 px-4 py-3 text-center ring-1 ring-white/20">
                <p className="text-2xl font-bold tabular-nums">{data.teachers_count}</p>
                <p className="text-[11px] text-blue-100">Guru</p>
              </div>
              <div className="min-w-[88px] rounded-2xl bg-white/12 px-4 py-3 text-center ring-1 ring-white/20">
                <p className="text-2xl font-bold tabular-nums">{data.students_count}</p>
                <p className="text-[11px] text-blue-100">Siswa</p>
              </div>
            </div>
          )}
          {actions}
        </div>
      </div>
    </section>
  );
}
