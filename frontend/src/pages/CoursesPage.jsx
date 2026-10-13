import { useState } from "react";
import { Plus, Trash2, Edit, GraduationCap, RefreshCw, BookMarked } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { AdminListToolbar } from "../components/admin/AdminListToolbar";
import { CourseModal } from "../components/modals/CourseModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { useAdminResource } from "../features/admin/useAdminResource";
import { useAdminDelete } from "../features/admin/useAdminDelete";

export function CoursesPage() {
  const { rows: courses, isLoading, reload, scope, canWrite, writeParams } = useAdminResource("courses");
  const del = useAdminDelete({ writeParams, onDeleted: reload });
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);

  const q = search.toLowerCase();
  const filteredCourses = courses.filter(
    (c) =>
      (c.title || "").toLowerCase().includes(q) ||
      (c.instructor?.name || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
  );

  const openCreate = () => {
    setCourseToEdit(null);
    setIsFormOpen(true);
  };

  const openEdit = (course) => {
    setCourseToEdit(course);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookMarked className="h-4 w-4" />
            </span>
            Mata Pelajaran
          </h2>
          <p className="text-xs text-slate-500 mt-1">Daftar mata pelajaran yang diajarkan di sekolah.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {canWrite && (
            <Button
              onClick={openCreate}
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Tambah Mapel
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-4 space-y-3">
        <AdminListToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Cari mata pelajaran atau guru..."
          scope={scope}
          total={filteredCourses.length}
          unit="Mata Pelajaran"
          searchWidth="sm:w-64"
        />
      </Card>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-3xl border border-slate-100 p-6 space-y-4">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </Card>
          ))
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            {search ? "Tidak ada mata pelajaran yang cocok dengan pencarian." : "Belum ada mata pelajaran terdaftar."}
          </div>
        ) : (
          filteredCourses.map((c) => (
            <Card
              key={c.id}
              className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-5 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">{c.code}</span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.title}</h3>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit Mata Pelajaran"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => del.requestDelete({ resource: "courses", id: c.id, name: c.title, noun: "Mata Pelajaran" })}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Hapus Mata Pelajaran"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {scope.isMaster && (
                  <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                    {c.school?.name ?? "–"}
                  </Badge>
                )}

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description || "Belum ada deskripsi."}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={c.instructor?.name}>
                  <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate font-semibold text-slate-800">{c.instructor?.name || "Belum ada pengampu"}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">{c.lessons?.length ?? 0} Modul</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <CourseModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={reload}
        courseToEdit={courseToEdit}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(del.target)}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        isLoading={del.isDeleting}
        title="Hapus Mata Pelajaran?"
        description={`Apakah Anda yakin ingin menghapus "${del.target?.name ?? ""}"? Semua bahan ajar dan kuis di dalamnya akan dihapus.`}
      />
    </div>
  );
}
