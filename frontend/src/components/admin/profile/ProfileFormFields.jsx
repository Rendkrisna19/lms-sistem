import { BookOpen, Briefcase, Home, Users } from "lucide-react";
import { Field } from "../../ui/field";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { CustomSelect } from "../../ui/custom-select";
import { controlProps } from "../../../hooks/useFormState";
import { EDUCATION_OPTIONS, EMPLOYMENT_OPTIONS, GENDER_OPTIONS } from "../../../features/admin/profile";

/** Judul bagian pada form: ikon kecil, judul, dan keterangan singkat. */
export function FormSection({ icon: Icon, title, description, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/**
 * Field profil untuk form guru atau siswa. `bind` dan `errors` berasal dari useFormState di form pemanggil.
 * Field yang kosong tetap boleh disimpan: semua data profil bersifat opsional.
 */
export function ProfileFormFields({ role, bind, setValue, errors, prefix }) {
  const id = (key) => `${prefix}-${key}`;
  /** Adaptor untuk pilihan kustom: menerima nilai langsung dan menyimpannya ke form. */
  const selectProps = (key) => ({ value: bind(key).value, onChange: (value) => setValue(key, value) });
  const field = (key, label, control, options = {}) => (
    <Field label={label} htmlFor={id(key)} error={errors[key]} hint={options.hint} className={options.wide ? "sm:col-span-2" : undefined}>
      {control}
    </Field>
  );

  const personal = (
    <>
      {field("gender", "Jenis kelamin", <CustomSelect id={id("gender")} invalid={Boolean(errors.gender)} {...selectProps("gender")} options={GENDER_OPTIONS} searchable={false} />)}
      {field("birth_date", "Tanggal lahir", <Input {...controlProps(id("birth_date"), errors.birth_date)} {...bind("birth_date")} type="date" />)}
      {field("birth_place", "Tempat lahir", <Input {...controlProps(id("birth_place"), errors.birth_place)} {...bind("birth_place")} placeholder="Contoh: Medan" />)}
      {field("phone", "No. telepon", <Input {...controlProps(id("phone"), errors.phone)} {...bind("phone")} inputMode="tel" placeholder="08xxxxxxxxxx" />)}
      {field("city", "Kota / kabupaten", <Input {...controlProps(id("city"), errors.city)} {...bind("city")} placeholder="Tempat tinggal saat ini" />)}
      {field(
        "address",
        "Alamat lengkap",
        <Textarea {...controlProps(id("address"), errors.address)} {...bind("address")} rows={2} maxLength={500} placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan" />,
        { wide: true }
      )}
    </>
  );

  return (
    <div className="space-y-7">
      <FormSection icon={Home} title="Data pribadi & alamat" description="Dipakai untuk identitas dan kontak di sekolah.">
        {personal}
      </FormSection>

      {role === "guru" ? (
        <FormSection icon={BookOpen} title="Pendidikan & kepegawaian" description="Riwayat pendidikan dan status mengajar.">
          {field("education_level", "Pendidikan terakhir", <CustomSelect id={id("education_level")} invalid={Boolean(errors.education_level)} {...selectProps("education_level")} options={EDUCATION_OPTIONS} searchable={false} />)}
          {field("education_major", "Jurusan / program studi", <Input {...controlProps(id("education_major"), errors.education_major)} {...bind("education_major")} placeholder="Contoh: Pendidikan Informatika" />)}
          {field("employment_status", "Status kepegawaian", <CustomSelect id={id("employment_status")} invalid={Boolean(errors.employment_status)} {...selectProps("employment_status")} options={EMPLOYMENT_OPTIONS} searchable={false} />)}
          {field("join_date", "Tanggal bergabung", <Input {...controlProps(id("join_date"), errors.join_date)} {...bind("join_date")} type="date" />)}
        </FormSection>
      ) : (
        <>
          <FormSection icon={Briefcase} title="Akademik & asal sekolah" description="Riwayat masuk siswa di sekolah ini.">
            {field("admission_year", "Tahun masuk", <Input {...controlProps(id("admission_year"), errors.admission_year)} {...bind("admission_year")} type="number" min={2000} max={2100} placeholder="Contoh: 2024" />)}
            {field("previous_school", "Asal sekolah", <Input {...controlProps(id("previous_school"), errors.previous_school)} {...bind("previous_school")} placeholder="SMP asal siswa" />)}
          </FormSection>
          <FormSection icon={Users} title="Orang tua / wali" description="Kontak yang dapat dihubungi bila diperlukan.">
            {field("parent_name", "Nama orang tua / wali", <Input {...controlProps(id("parent_name"), errors.parent_name)} {...bind("parent_name")} />)}
            {field("parent_phone", "No. HP orang tua", <Input {...controlProps(id("parent_phone"), errors.parent_phone)} {...bind("parent_phone")} inputMode="tel" />)}
            {field("parent_job", "Pekerjaan orang tua", <Input {...controlProps(id("parent_job"), errors.parent_job)} {...bind("parent_job")} />, { wide: true })}
          </FormSection>
        </>
      )}
    </div>
  );
}
