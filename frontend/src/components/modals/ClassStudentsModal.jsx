import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Users, UserPlus, Trash2, GraduationCap, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CustomSelect } from "../ui/custom-select";
import { SchoolScopeNotice } from "../admin/SchoolScopeSelect";
import { adminApi } from "../../features/admin/adminApi";
import { useAdminResource } from "../../features/admin/useAdminResource";
import { useApiQuery } from "../../hooks/useApiQuery";
import { getErrorMessage } from "../../lib/api";

/** Anggota siswa sebuah kelas: tambah dan keluarkan siswa. */
export function ClassStudentsModal({ isOpen, onClose, onSuccess, classroom = null }) {
  if (!isOpen || !classroom) return null;
  return <StudentsDialog classroom={classroom} onClose={onClose} onSuccess={onSuccess} />;
}

function StudentsDialog({ classroom, onClose, onSuccess }) {
  const allStudents = useAdminResource("students");
  const scope = allStudents.scope;
  const detail = useApiQuery(`/admin/classrooms/${classroom.id}`, { params: scope.params });
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const enrolled = detail.data?.students ?? [];
  const candidateStudents = allStudents.rows.filter(
    (s) => String(s.classroom_id) !== String(classroom.id) && !enrolled.some((cs) => cs.id === s.id)
  );
  const filteredEnrolled = enrolled.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (s.name || "").toLowerCase().includes(q) || (s.nomor_induk || "").includes(q);
  });

  const refreshAfterChange = () => {
    detail.reload();
    allStudents.reload();
    onSuccess?.();
  };

  const handleAddStudent = async () => {
    if (!selectedStudentToAdd) {
      toast.error("Pilih siswa yang ingin dimasukkan ke kelas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminApi.create(
        `classrooms/${classroom.id}/assign-student`,
        { student_id: Number(selectedStudentToAdd) },
        scope.params
      );
      toast.success(res.message);
      setSelectedStudentToAdd("");
      refreshAfterChange();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menambahkan siswa ke kelas."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    try {
      await adminApi.remove(`classrooms/${classroom.id}/students`, studentId, scope.params);
      toast.info(`Siswa ${studentName} dikeluarkan dari kelas.`);
      refreshAfterChange();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengeluarkan siswa dari kelas."));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-visible animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Daftar Siswa Kelas {classroom.code}</h3>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">{enrolled.length} Siswa Terdaftar</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {classroom.name} • Wali Kelas: {classroom.homeroom_teacher?.name || "Belum Ditentukan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full p-1 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <SchoolScopeNotice scope={scope} />
        </div>

        {/* Quick Add Student Section */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <label className="text-xs font-bold text-slate-700 block">Masukkan Siswa ke Kelas Ini:</label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full">
              <CustomSelect
                value={selectedStudentToAdd}
                onChange={setSelectedStudentToAdd}
                options={candidateStudents.map((s) => ({
                  value: s.id,
                  label: s.name,
                  description: `NIS: ${s.nomor_induk || s.nim_nip} ${s.classroom ? `(Saat ini: ${s.classroom.code})` : "(Belum ada kelas)"}`,
                }))}
                placeholder="Pilih Siswa untuk Ditambahkan..."
                icon={GraduationCap}
              />
            </div>
            <Button
              type="button"
              disabled={isSubmitting || !selectedStudentToAdd || !scope.canWrite}
              onClick={handleAddStudent}
              className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 shrink-0 gap-1.5 shadow-xs cursor-pointer"
            >
              <UserPlus className="h-4 w-4" /> Masukkan Siswa
            </Button>
          </div>
        </div>

        {/* Search & Enrolled Students List */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa di kelas ini..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {detail.error ? (
              <div className="py-8 text-center text-xs text-red-500">{detail.error}</div>
            ) : filteredEnrolled.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {detail.isLoading
                  ? "Memuat daftar siswa..."
                  : search
                  ? "Tidak ditemukan siswa yang cocok"
                  : "Belum ada siswa yang dialokasikan ke kelas ini"}
              </div>
            ) : (
              filteredEnrolled.map((s) => (
                <div key={s.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>NIS: {s.nomor_induk}</span>
                        <span>•</span>
                        <span className="truncate">{s.email}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(s.id, s.name)}
                    disabled={!scope.canWrite}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Keluarkan dari kelas"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
          <Button type="button" onClick={onClose} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 shadow-xs cursor-pointer">
            Selesai
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
