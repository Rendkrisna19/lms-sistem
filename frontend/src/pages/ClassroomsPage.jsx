import { useState } from "react";
import { toast } from "sonner";
import {
  School,
  Plus,
  Trash2,
  Edit,
  Users,
  BookMarked,
  RefreshCw,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Pagination } from "../components/ui/pagination";
import { AdminListToolbar } from "../components/admin/AdminListToolbar";
import { SchoolScopeNotice } from "../components/admin/SchoolScopeSelect";
import { ClassroomModal } from "../components/modals/ClassroomModal";
import { ClassAssignmentModal } from "../components/modals/ClassAssignmentModal";
import { ClassStudentsModal } from "../components/modals/ClassStudentsModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { useAdminResource } from "../features/admin/useAdminResource";
import { useAdminDelete } from "../features/admin/useAdminDelete";
import { adminApi } from "../features/admin/adminApi";
import { usePagedList } from "../hooks/usePagedList";
import { getErrorMessage } from "../lib/api";

const ITEMS_PER_PAGE = 4;

export function ClassroomsPage() {
  const { rows: classrooms, isLoading, reload, scope, canWrite, writeParams } = useAdminResource("classrooms");
  const del = useAdminDelete({ writeParams, onDeleted: reload });
  const [search, setSearch] = useState("");
  // Satu modal aktif sekaligus: { type: "class" | "assign" | "students", classroom }
  const [activeModal, setActiveModal] = useState(null);

  const q = search.trim().toLowerCase();
  const filteredClassrooms = classrooms.filter(
    (c) =>
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      (c.homeroom_teacher?.name || "").toLowerCase().includes(q)
  );
  const { page, setPage, totalPages, pageItems } = usePagedList(filteredClassrooms, ITEMS_PER_PAGE);

  const openModal = (type, classroom = null) => setActiveModal({ type, classroom });
  const closeModal = () => setActiveModal(null);
  const isOpen = (type) => activeModal?.type === type;
  const modalClassroom = activeModal?.classroom ?? null;

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await adminApi.remove("assignments", assignmentId, writeParams);
      toast.info("Plotting mata pelajaran berhasil dihapus.");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menghapus plotting penugasan."));
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <School className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Data Kelas</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">Daftar kelas dan rombongan belajar yang terdaftar.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Fitur Export Excel akan segera tersedia.")}
            className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9 px-3.5 gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Fitur Export PDF akan segera tersedia.")}
            className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9 px-3.5 gap-1.5"
          >
            <FileText className="h-4 w-4 text-red-600" />
            <span>Export PDF</span>
          </Button>

          {canWrite && (
            <Button
              size="sm"
              onClick={() => openModal("class")}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kelas</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isLoading}
            className="rounded-full text-xs h-9 px-3.5 gap-1.5 text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-4 space-y-3">
        <AdminListToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Cari nama atau kode kelas..."
          scope={scope}
          total={filteredClassrooms.length}
          unit="Kelas"
          searchWidth="sm:w-64"
        />
        <SchoolScopeNotice scope={scope} />
      </Card>

      {/* Classrooms Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 rounded-3xl bg-white border border-slate-100 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </Card>
          ))}
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-12 text-center">
          <School className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Data Kelas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? "Tidak ada rombel kelas yang cocok dengan kata kunci pencarian." : "Belum ada rombel kelas terdaftar."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {pageItems.map((c) => (
              <Card
                key={c.id}
                className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-5 sm:p-6 space-y-5 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Header: Class Title & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-mono font-bold text-xs px-2.5">{c.code}</Badge>
                        {scope.isMaster && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                            {c.school?.name ?? "–"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tahun Ajaran: <span className="font-semibold text-slate-700">{c.academic_year || "–"}</span>
                      </p>
                    </div>

                    {canWrite && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openModal("class", c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Kelas"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => del.requestDelete({ resource: "classrooms", id: c.id, name: c.name, noun: "Kelas" })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Homeroom Teacher Pill */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">Wali Kelas</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{c.homeroom_teacher?.name || "Belum Ditetapkan"}</p>
                    </div>
                  </div>

                  {/* Quick Numbers Bar */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100/60 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-blue-600 font-medium">Jumlah Siswa</p>
                        <h4 className="text-lg font-extrabold text-blue-900 mt-0.5">
                          {c.students_count ?? 0} <span className="text-xs font-normal">Siswa</span>
                        </h4>
                      </div>
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>

                    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100/60 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-blue-600 font-medium">Mata Pelajaran</p>
                        <h4 className="text-lg font-extrabold text-blue-900 mt-0.5">
                          {c.subject_assignments?.length ?? 0} <span className="text-xs font-normal">Mapel</span>
                        </h4>
                      </div>
                      <BookMarked className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>

                  {/* Subject Assignments List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Mata Pelajaran & Guru Pengampu</span>

                    {c.subject_assignments && c.subject_assignments.length > 0 ? (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {c.subject_assignments.map((asgn) => (
                          <div
                            key={asgn.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{asgn.course?.title}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                Pengampu: <span className="text-slate-600 font-medium">{asgn.teacher?.name}</span>
                              </p>
                            </div>

                            {canWrite && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAssignment(asgn.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                                title="Hapus Plotting Mapel"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Belum ada penugasan guru pengampu di kelas ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons in Card Footer */}
                {canWrite && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      id={`btn-anggota-siswa-${c.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => openModal("students", c)}
                      className="rounded-xl text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Users className="h-3.5 w-3.5 mr-1" /> Anggota Siswa
                    </Button>
                    <Button
                      id={`btn-plotting-mapel-${c.id}`}
                      size="sm"
                      onClick={() => openModal("assign", c)}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Plotting Mapel
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredClassrooms.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
              itemName="kelas"
            />
          </Card>
        </div>
      )}

      <ClassroomModal
        isOpen={isOpen("class")}
        onClose={closeModal}
        onSuccess={reload}
        classToEdit={modalClassroom}
      />

      <ClassAssignmentModal
        isOpen={isOpen("assign")}
        onClose={closeModal}
        onSuccess={reload}
        classroom={modalClassroom}
      />

      <ClassStudentsModal
        isOpen={isOpen("students")}
        onClose={closeModal}
        onSuccess={reload}
        classroom={modalClassroom}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(del.target)}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        isLoading={del.isDeleting}
        title="Hapus Rombel Kelas?"
        description={`Apakah Anda yakin ingin menghapus kelas "${del.target?.name ?? ""}"? Data plotting guru dan penugasan akan dihapus.`}
      />
    </div>
  );
}
