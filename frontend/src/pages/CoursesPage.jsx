import React, { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Edit, GraduationCap, Search, RefreshCw, BookMarked, Building2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { CourseModal } from "../components/modals/CourseModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { api } from "../lib/api";
import { toast } from "sonner";

export function CoursesPage({ currentUser }) {
  const isAdminMaster = currentUser?.role === "admin_master";

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch schools list for filter
  const fetchSchools = async () => {
    try {
      const res = await api.get("/admin/schools");
      if (res.data?.status === "success") {
        setSchools(res.data.data);
      }
    } catch (e) {
      console.warn("Could not load schools:", e);
    }
  };

  const fetchCourses = async (schoolId = selectedSchool) => {
    try {
      setIsLoading(true);
      const url = isAdminMaster
        ? (schoolId === "all" ? "/master/courses" : `/master/courses?school_id=${schoolId}`)
        : currentUser?.role === "guru"
        ? (currentUser?.id ? `/teacher/courses?teacher_id=${currentUser.id}` : "/teacher/courses")
        : "/admin/courses";

      const res = await api.get(url);
      if (res.data?.status === "success") {
        setCourses(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat daftar mata pelajaran dari backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/admin/teachers");
      if (res.data?.status === "success") {
        setTeachers(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch teachers for dropdown:", err);
    }
  };

  useEffect(() => {
    if (isAdminMaster) {
      fetchSchools();
    }
    fetchCourses("all");
    fetchTeachers();
  }, [isAdminMaster, currentUser?.id, currentUser?.role]);

  const handleSchoolFilterChange = (val) => {
    setSelectedSchool(val);
    fetchCourses(val);
  };

  const handleOpenCreate = () => {
    setCourseToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setCourseToEdit(course);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/courses/${courseToDelete.id}`);
      if (res.data?.status === "success") {
        toast.success(`Mata Pelajaran "${courseToDelete.title}" berhasil dihapus.`);
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
        fetchCourses(selectedSchool);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus mata pelajaran.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    const titleMatch = (c.title || "").toLowerCase().includes(q);
    const teacherMatch = (c.instructor?.name || "").toLowerCase().includes(q);
    const descMatch = (c.description || "").toLowerCase().includes(q);
    return titleMatch || teacherMatch || descMatch;
  });

  const schoolOptions = [
    { value: "all", label: "Semua Sekolah" },
    ...schools.map((s) => ({
      value: s.id,
      label: s.name,
    })),
  ];

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
          <p className="text-xs text-slate-500 mt-1">
            {currentUser?.role === "guru"
              ? `Daftar mata pelajaran yang ditugaskan kepada Anda (${currentUser?.name || "Guru Pengampu"}).`
              : "Daftar mata pelajaran yang diajarkan di sekolah."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCourses(selectedSchool)}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {!isAdminMaster && currentUser?.role !== "guru" && (
            <Button
              onClick={handleOpenCreate}
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
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 max-w-xl">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mata pelajaran atau guru..."
                className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
              />
            </div>

            {isAdminMaster && (
              <div className="w-full sm:w-56">
                <CustomSelect
                  value={selectedSchool}
                  onChange={handleSchoolFilterChange}
                  options={schoolOptions}
                  placeholder="Filter Sekolah"
                  icon={Building2}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Total:</span>
            <strong className="text-slate-800">{filteredCourses.length} Mata Pelajaran</strong>
          </div>
        </div>
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
                    <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                      {c.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {c.title}
                    </h3>
                  </div>

                  {!isAdminMaster && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(c)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit Mata Pelajaran"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDelete(c)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Hapus Mata Pelajaran"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {isAdminMaster && (
                  <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                    {c.school?.name || "SMA Mitra Inalum"}
                  </Badge>
                )}

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {c.description || "Mata pelajaran kurikulum standar dengan bahan ajar multimedia dan evaluasi berkala."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={c.instructor?.name}>
                  <GraduationCap className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate font-semibold text-slate-800">
                    {c.instructor?.name || "Belum ada pengampu"}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  {c.lessons?.length || 3} Modul
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modals for School Admin */}
      {!isAdminMaster && (
        <>
          <CourseModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSuccess={() => fetchCourses(selectedSchool)}
            courseToEdit={courseToEdit}
            teachers={teachers}
          />

          <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            isLoading={isDeleting}
            title="Hapus Mata Pelajaran?"
            description={`Apakah Anda yakin ingin menghapus "${courseToDelete?.title}"? Semua bahan ajar dan kuis di dalamnya akan dihapus.`}
          />
        </>
      )}
    </div>
  );
}
