import { useState } from "react";
import { Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useApiQuery } from "../../hooks/useApiQuery";
import { useSchoolScope } from "../../hooks/useSchoolScope";
import { useFormState, controlProps } from "../../hooks/useFormState";
import { schoolApi } from "../../features/school/api";
import { getErrorMessage, getValidationErrors } from "../../lib/api";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Field } from "../ui/field";
import { Input } from "../ui/input";
import { Alert } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { ConfirmDeleteModal } from "../modals/ConfirmDeleteModal";

const MIN_PASSWORD = 8;

function AddAdminDialog({ open, onClose, onCreated, params }) {
  const { values, bind, errors, setErrors } = useFormState({ name: "", nomor_induk: "", email: "", password: "" });
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.name.trim()) next.name = "Nama wajib diisi.";
    if (!values.nomor_induk.trim()) next.nomor_induk = "Nomor induk wajib diisi.";
    if (!values.email.trim()) next.email = "Email wajib diisi.";
    if (values.password.length < MIN_PASSWORD) next.password = `Kata sandi minimal ${MIN_PASSWORD} karakter.`;
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    setIsSaving(true);
    try {
      const res = await schoolApi.createAdmin(
        { name: values.name.trim(), nomor_induk: values.nomor_induk.trim(), email: values.email.trim(), password: values.password },
        params
      );
      toast.success(res.message);
      onCreated?.();
      onClose();
    } catch (err) {
      setErrors(getValidationErrors(err));
      toast.error(getErrorMessage(err, "Admin belum dapat ditambahkan."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!isSaving}
      size="md"
      title="Tambah admin sekolah"
      description="Admin baru dapat mengelola data sekolah ini, termasuk guru dan siswa."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={submit} isLoading={isSaving}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Tambah admin
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nama lengkap" htmlFor="admin-name" required error={errors.name} className="sm:col-span-2">
          <Input {...controlProps("admin-name", errors.name)} {...bind("name")} />
        </Field>
        <Field label="Nomor induk / ID" htmlFor="admin-nip" required error={errors.nomor_induk}>
          <Input {...controlProps("admin-nip", errors.nomor_induk)} {...bind("nomor_induk")} className="font-mono" />
        </Field>
        <Field label="Email login" htmlFor="admin-email" required error={errors.email}>
          <Input {...controlProps("admin-email", errors.email)} {...bind("email")} type="email" />
        </Field>
        <Field label="Kata sandi awal" htmlFor="admin-password" required error={errors.password} hint={`Minimal ${MIN_PASSWORD} karakter.`} className="sm:col-span-2">
          <Input {...controlProps("admin-password", errors.password)} {...bind("password")} type="password" autoComplete="new-password" />
        </Field>
      </form>
    </Dialog>
  );
}

/** Daftar admin sekolah: tambah admin baru dan hapus admin lain di sekolah yang sama. */
export function SchoolAdminsCard({ currentUserId }) {
  const scope = useSchoolScope();
  const admins = useApiQuery("/admin/accounts", { params: { ...scope.params, role: "admin" }, select: (body) => body.data?.accounts ?? [] });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const list = admins.data ?? [];

  const confirmRemove = async () => {
    setIsDeleting(true);
    try {
      const res = await schoolApi.removeAdmin(target.id, scope.params);
      toast.success(res.message);
      setTarget(null);
      admins.reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Admin belum dapat dihapus."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Admin sekolah</h2>
            <p className="text-xs text-slate-500">Akun yang dapat mengelola data sekolah ini.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)} disabled={!scope.canWrite}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Tambah admin
        </Button>
      </header>

      {admins.isLoading && !admins.data ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : admins.error ? (
        <Alert variant="danger" title="Daftar admin gagal dimuat">{admins.error}</Alert>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {list.map((admin) => {
            const isSelf = admin.id === currentUserId || admin.is_self;
            return (
              <li key={admin.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {admin.name}
                    {isSelf && <span className="ml-2 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">Anda</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {admin.nomor_induk} · {admin.email}
                  </p>
                </div>
                {!isSelf && (
                  <Button variant="ghost" size="icon-sm" className="text-red-600 hover:bg-red-50" onClick={() => setTarget(admin)} aria-label={`Hapus ${admin.name}`} title="Hapus admin">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                )}
              </li>
            );
          })}
          {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">Belum ada admin sekolah.</li>}
        </ul>
      )}

      <AddAdminDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={admins.reload} params={scope.params} />

      <ConfirmDeleteModal
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirmRemove}
        isLoading={isDeleting}
        title="Hapus admin sekolah?"
        description={`Akun "${target?.name ?? ""}" tidak lagi dapat masuk dan mengelola sekolah ini.`}
      />
    </section>
  );
}
