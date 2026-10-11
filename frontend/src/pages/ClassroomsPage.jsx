import React, { useState, useEffect } from "react";
import {
  School,
  Plus,
  Trash2,
  Edit,
  Users,
  BookMarked,
  Layers,
  Clock,
  Calendar,
  MapPin,
  RefreshCw,
  Search,
  UserCheck,
  ShieldCheck,
  ChevronRight,
  Building2,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { Pagination } from "../components/ui/pagination";
import { ClassroomModal } from "../components/modals/ClassroomModal";
import { ClassAssignmentModal } from "../components/modals/ClassAssignmentModal";
import { ClassStudentsModal } from "../components/modals/ClassStudentsModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { api } from "../lib/api";
import { toast } from "sonner";

export function ClassroomsPage({ currentUser }) {
  const isAdminMaster = currentUser?.role === "admin_master";

  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [classToAssign, setClassToAssign] = useState(null);

  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [classForStudents, setClassForStudents] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
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

  const fetchClassrooms = async (schoolId = selectedSchool) => {
    try {
      setIsLoading(true);
      const classesUrl = isAdminMaster
        ? (schoolId === "all" ? "/master/classrooms" : `/master/classrooms?school_id=${schoolId}`)
        : "/admin/classrooms";

      const resClasses = await api.get(classesUrl);
      if (resClasses.data?.status === "success") {
        setClassrooms(resClasses.data.data);
      }

      // Load auxiliary options for modals if school admin
      if (!isAdminMaster) {
        try {
          const [resTeachers, resCourses, resStudents] = await Promise.all([
            api.get("/admin/teachers"),
            api.get("/admin/courses"),
            api.get("/admin/students"),
          ]);
          if (resTeachers.data?.status === "success") setTeachers(resTeachers.data.data);
          if (resCourses.data?.status === "success") setCourses(resCourses.data.data);
          if (resStudents.data?.status === "success") setAllStudents(resStudents.data.data);
        } catch (auxErr) {
          console.warn("Could not load auxiliary options:", auxErr);
        }
      }
    } catch (err) {
      toast.error("Gagal memuat data kelas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminMaster) {
      fetchSchools();
    }
    fetchClassrooms("all");
  }, [isAdminMaster]);

  const handleSchoolFilterChange = (val) => {
    setSelectedSchool(val);
    setCurrentPage(1);
    fetchClassrooms(val);
  };

  const handleOpenDetailClass = async (classItem, modalType) => {
    const classId = typeof classItem === "object" && classItem !== null ? classItem.id : classItem;
    const existing = typeof classItem === "object" && classItem !== null ? classItem : classrooms.find((c) => String(c.id) === String(classId));

    if (modalType === "students") {
      setClassForStudents(existing || { id: classId, name: "Kelas", students: [] });
      setIsStudentsModalOpen(true);
    } else if (modalType === "assign") {
      setClassToAssign(existing || { id: classId, name: "Kelas" });
      setIsAssignModalOpen(true);
    }

    try {
      const res = await api.get(`/admin/classrooms/${classId}`);
      if (res.data?.status === "success") {
        const detail = res.data.data;
        if (modalType === "students") {
          setClassForStudents(detail);
        } else if (modalType === "assign") {
          setClassToAssign(detail);
        }
      }
    } catch (err) {
      if (!existing) {
        toast.error("Gagal memuat rincian kelas.");
      }
    }
  };

  const handleDeleteClassConfirm = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/classrooms/${classToDelete.id}`);
      if (res.data?.status === "success") {
        toast.success(`Kelas "${classToDelete.name}" berhasil dihapus.`);
        setIsDeleteModalOpen(false);
        setClassToDelete(null);
        fetchClassrooms(selectedSchool);
      }
    } catch (err) {
      toast.error("Gagal menghapus kelas.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      const res = await api.delete(`/admin/assignments/${assignmentId}`);
      if (res.data?.status === "success") {
        toast.info("Plotting mata pelajaran berhasil dihapus.");
        fetchClassrooms(selectedSchool);
      }
    } catch (err) {
      toast.error("Gagal menghapus plotting penugasan.");
    }
  };

  const filteredClassrooms = classrooms.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      (c.homeroom_teacher?.name || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredClassrooms.length / itemsPerPage) || 1;
  const paginatedClassrooms = filteredClassrooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <School className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Data Kelas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar kelas dan rombongan belajar yang terdaftar.
          </p>
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

          {!isAdminMaster && (
            <Button
              size="sm"
              onClick={() => {
                setClassToEdit(null);
                setIsClassModalOpen(true);
              }}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-4 gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kelas</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClassrooms(selectedSchool)}
            disabled={isLoading}
            className="rounded-full text-xs h-9 px-3.5 gap-1.5 text-slate-600 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </Button>
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
                placeholder="Cari nama atau kode kelas..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
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
            <strong className="text-slate-800">{filteredClassrooms.length} Kelas</strong>
          </div>
        </div>
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
            {paginatedClassrooms.map((c) => (
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
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-mono font-bold text-xs px-2.5">
                        {c.code}
                      </Badge>
                      {isAdminMaster && (
                        <Badge variant="outline" className="text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                          {c.school?.name || "SMA Mitra Inalum"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tahun Ajaran: <span className="font-semibold text-slate-700">{c.academic_year || "2026/2027"}</span>
                    </p>
                  </div>

                  {!isAdminMaster && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setClassToEdit(c);
                          setIsClassModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Kelas"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setClassToDelete(c);
                          setIsDeleteModalOpen(true);
                        }}
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
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {c.homeroom_teacher?.name || "Belum Ditetapkan"}
                    </p>
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
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Mata Pelajaran & Guru Pengampu
                  </span>

                  {c.subject_assignments && c.subject_assignments.length > 0 ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {c.subject_assignments.map((asgn) => (
                        <div
                          key={asgn.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              {asgn.course?.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              Pengampu: <span className="text-slate-600 font-medium">{asgn.teacher?.name}</span>
                            </p>
                          </div>

                          {!isAdminMaster && (
                            <button
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
              {!isAdminMaster && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    id={`btn-anggota-siswa-${c.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetailClass(c, "students")}
                    className="rounded-xl text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5 mr-1" /> Anggota Siswa
                  </Button>
                  <Button
                    id={`btn-plotting-mapel-${c.id}`}
                    size="sm"
                    onClick={() => handleOpenDetailClass(c, "assign")}
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
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClassrooms.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              itemName="kelas"
            />
          </Card>
        </div>
      )}

      {/* Modals for School Admin */}
      {!isAdminMaster && (
        <>
          <ClassroomModal
            isOpen={isClassModalOpen}
            onClose={() => setIsClassModalOpen(false)}
            onSuccess={() => fetchClassrooms(selectedSchool)}
            classToEdit={classToEdit}
            teachers={teachers}
          />

          <ClassAssignmentModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            onSuccess={() => fetchClassrooms(selectedSchool)}
            classroom={classToAssign}
            courses={courses}
            teachers={teachers}
          />

          <ClassStudentsModal
            isOpen={isStudentsModalOpen}
            onClose={() => setIsStudentsModalOpen(false)}
            onSuccess={() => fetchClassrooms(selectedSchool)}
            classroom={classForStudents}
            allStudents={allStudents}
          />

          <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteClassConfirm}
            isLoading={isDeleting}
            title="Hapus Rombel Kelas?"
            description={`Apakah Anda yakin ingin menghapus kelas "${classToDelete?.name}"? Data plotting guru dan penugasan akan dihapus.`}
          />
        </>
      )}
    </div>
  );
}
