import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Save, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useSchoolScope } from "../../hooks/useSchoolScope";
import { schoolApi, ACCREDITATION_OPTIONS, JENJANG_OPTIONS } from "../../features/school/api";
import { getErrorMessage, getValidationErrors } from "../../lib/api";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CustomSelect } from "../ui/custom-select";
import { Skeleton } from "../ui/skeleton";
import { Alert } from "../ui/alert";
import { controlProps } from "../../hooks/useFormState";

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Logo sekolah: pratinjau, unggah, ganti, dan hapus. Berkas baru hanya terkirim saat disimpan. */
function LogoPicker({ currentUrl, file, onPick, onRemove, removed, initial }) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const shown = previewUrl ?? (removed ? null : currentUrl);

  return (
    <div className="space-y-3">
      <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3">
        {shown ? (
          <img src={shown} alt={`Logo ${initial}`} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-slate-400">
            <Building2 className="h-8 w-8" aria-hidden="true" />
            <span className="text-[11px] font-medium">Belum ada logo</span>
          </span>
        )}
      </div>
      <div className="flex w-36 flex-col gap-2">
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-700">
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {shown ? "Ganti logo" : "Unggah logo"}
          <input type="file" accept={ACCEPT} className="sr-only" onChange={(event) => onPick(event.target.files?.[0] ?? null)} />
        </label>
        {(shown || file) && (
          <button type="button" onClick={onRemove} className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Hapus logo
          </button>
        )}
        <p className="text-[11px] leading-relaxed text-slate-500">JPG, PNG, atau WEBP. Maksimal 2 MB.</p>
      </div>
    </div>
  );
}

/** Form berisi data awal dari server. Dipasang ulang (key) setiap kali data berubah, sehingga state selalu segar. */
function SchoolProfileFormBody({ school, params, onSaved }) {
  const [values, setValues] = useState({
    name: school.name ?? "",
    npsn: school.npsn ?? "",
    jenjang: school.jenjang ?? "",
    accreditation: school.accreditation ?? "",
    address: school.address ?? "",
    phone: school.phone ?? "",
    email: school.email ?? "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const set = (key) => (value) => setValues((prev) => ({ ...prev, [key]: value }));
  const text = (key) => ({ value: values[key], onChange: (event) => set(key)(event.target.value) });

  const save = async (event) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setErrors({ name: "Nama sekolah wajib diisi." });
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.append(key, value.trim()));
    if (logoFile) formData.append("logo", logoFile);
    if (removeLogo && !logoFile) formData.append("remove_logo", "1");

    setIsSaving(true);
    try {
      const res = await schoolApi.save(formData, params);
      toast.success(res.message);
      setErrors({});
      setLogoFile(null);
      setRemoveLogo(false);
      onSaved?.();
    } catch (err) {
      setErrors(getValidationErrors(err));
      toast.error(getErrorMessage(err, "Data sekolah belum dapat disimpan."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="grid grid-cols-1 gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
      <LogoPicker
        currentUrl={school.logo_url}
        file={logoFile}
        removed={removeLogo}
        initial={school.name}
        onPick={(file) => {
          setLogoFile(file);
          setRemoveLogo(false);
        }}
        onRemove={() => {
          setLogoFile(null);
          setRemoveLogo(true);
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama sekolah" htmlFor="school-name" required error={errors.name} className="sm:col-span-2">
          <Input {...controlProps("school-name", errors.name)} {...text("name")} maxLength={255} />
        </Field>
        <Field label="NPSN" htmlFor="school-npsn" error={errors.npsn} hint="Nomor Pokok Sekolah Nasional.">
          <Input {...controlProps("school-npsn", errors.npsn)} {...text("npsn")} className="font-mono" inputMode="numeric" />
        </Field>
        <Field label="Jenjang" htmlFor="school-jenjang" error={errors.jenjang}>
          <CustomSelect id="school-jenjang" invalid={Boolean(errors.jenjang)} value={values.jenjang} onChange={set("jenjang")} options={JENJANG_OPTIONS} searchable={false} />
        </Field>
        <Field label="Akreditasi" htmlFor="school-accreditation" error={errors.accreditation}>
          <CustomSelect
            id="school-accreditation"
            invalid={Boolean(errors.accreditation)}
            value={values.accreditation}
            onChange={set("accreditation")}
            options={ACCREDITATION_OPTIONS}
            searchable={false}
          />
        </Field>
        <Field label="Telepon" htmlFor="school-phone" error={errors.phone}>
          <Input {...controlProps("school-phone", errors.phone)} {...text("phone")} inputMode="tel" />
        </Field>
        <Field label="Email sekolah" htmlFor="school-email" error={errors.email} className="sm:col-span-2">
          <Input {...controlProps("school-email", errors.email)} {...text("email")} type="email" />
        </Field>
        <Field label="Alamat lengkap" htmlFor="school-address" error={errors.address} className="sm:col-span-2">
          <Textarea {...controlProps("school-address", errors.address)} {...text("address")} rows={3} maxLength={500} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 lg:col-span-2">
        <Button type="submit" isLoading={isSaving} disabled={isSaving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Simpan data sekolah
        </Button>
      </div>
    </form>
  );
}

/** Kartu "Data sekolah" untuk admin sekolah di halaman Pengaturan. */
export function SchoolProfileForm() {
  const scope = useSchoolScope();
  const school = useApiQuery("/admin/school", { params: scope.params, select: (body) => body.data });

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <header className="mb-6 flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <Building2 className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">Data sekolah</h2>
          <p className="text-xs text-slate-500">Logo, identitas, dan akreditasi yang tampil di dashboard dan rapor.</p>
        </div>
      </header>

      {school.isLoading && !school.data ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : school.error ? (
        <Alert variant="danger" title="Data sekolah gagal dimuat" action={<Button size="sm" variant="outline" onClick={school.reload}>Coba lagi</Button>}>
          {school.error}
        </Alert>
      ) : (
        <SchoolProfileFormBody key={`${school.data.id}-${school.data.logo_url}-${school.data.name}`} school={school.data} params={scope.params} onSaved={school.reload} />
      )}
    </section>
  );
}
