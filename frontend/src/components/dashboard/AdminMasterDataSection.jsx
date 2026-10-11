import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, GraduationCap, BookMarked, Search, RefreshCw, ShieldCheck, Mail, BookOpen } from "lucide-react";
import { Card } from "../ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { TeacherModal } from "../modals/TeacherModal";
import { StudentModal } from "../modals/StudentModal";
import { CourseModal } from "../modals/CourseModal";
import { ConfirmDeleteModal } from "../modals/ConfirmDeleteModal";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function AdminMasterDataSection({ onDataUpdated, onNavigateTab }) {
  const [activeSubTab, setActiveSubTab] = useState("guru"); // 'guru' | 'siswa' | 'mapel'
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals state for Teachers
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);

  // Modals state for Students
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  // Modals state for Courses (Mata Pelajaran)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);

  // Delete Alert Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'guru'|'siswa'|'mapel', data: {...} }
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch real data from Laravel MySQL
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [teachersRes, studentsRes, coursesRes] = await Promise.all([
        api.get("/admin/teachers"),
        api.get("/admin/students"),
        api.get("/admin/courses"),
      ]);

      if (teachersRes.data?.data) setTeachers(teachersRes.data.data);
      if (studentsRes.data?.data) setStudents(studentsRes.data.data);
      if (coursesRes.data?.data) setCourses(coursesRes.data.data);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      toast.error("Gagal memuat data master dari server backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handlers for Teacher
  const handleOpenCreateTeacher = () => {
    setTeacherToEdit(null);
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (t) => {
    setTeacherToEdit(t);
    setIsTeacherModalOpen(true);
  };

  // Handlers for Student
  const handleOpenCreateStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (s) => {
    setStudentToEdit(s);
    setIsStudentModalOpen(true);
  };

  // Handlers for Mata Pelajaran
  const handleOpenCreateCourse = () => {
    setCourseToEdit(null);
    setIsCourseModalOpen(true);
  };

  const handleOpenEditCourse = (c) => {
    setCourseToEdit(c);
    setIsCourseModalOpen(true);
  };

  // Handlers for Delete Confirmation
  const handleOpenDelete = (type, data) => {
    setItemToDelete({ type, data });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      if (itemToDelete.type === "guru") {
        await api.delete(`/admin/teachers/${itemToDelete.data.id}`);
        toast.success(`Data Guru "${itemToDelete.data.name}" berhasil dihapus.`);
      } else if (itemToDelete.type === "siswa") {
        await api.delete(`/admin/students/${itemToDelete.data.id}`);
        toast.success(`Data Siswa "${itemToDelete.data.name}" berhasil dihapus.`);
      } else {
        await api.delete(`/admin/courses/${itemToDelete.data.id}`);
        toast.success(`Mata Pelajaran "${itemToDelete.data.title}" berhasil dihapus.`);
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus data.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered lists
  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.nomor_induk || t.nim_nip || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q)
    );
  });

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.nomor_induk || s.nim_nip || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.title || "").toLowerCase().includes(q) ||
      (c.instructor?.name || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <Card className="bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 w-full">
      {/* Section Header with Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            {activeSubTab === "guru" ? (
              <Users className="h-5 w-5" />
            ) : activeSubTab === "siswa" ? (
              <GraduationCap className="h-5 w-5 text-blue-600" />
            ) : (
              <BookMarked className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Manajemen Data Master Akademik
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola data guru pengampu, siswa belajar, dan mata pelajaran kurikulum secara realtime
            </p>
          </div>
        </div>

        {/* Tab Pills & Add Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs">
            <button
              onClick={() => {
                setActiveSubTab("guru");
                setSearch("");
              }}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                activeSubTab === "guru"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Data Guru ({teachers.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab("siswa");
                setSearch("");
              }}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                activeSubTab === "siswa"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Data Siswa ({students.length})
            </button>
            <button
              onClick={() => {
                setActiveSubTab("mapel");
                setSearch("");
              }}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                activeSubTab === "mapel"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Mata Pelajaran ({courses.length})
            </button>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab("kelas")}
                className="px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer text-slate-600 hover:text-blue-700 hover:bg-white/90"
                title="Buka Halaman Manajemen Kelas & Plotting Guru"
              >
                Kelas & Plotting →
              </button>
            )}
          </div>

          {activeSubTab === "guru" ? (
            <Button
              onClick={handleOpenCreateTeacher}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 h-8 shadow-xs cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Guru
            </Button>
          ) : activeSubTab === "siswa" ? (
            <Button
              onClick={handleOpenCreateStudent}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 h-8 shadow-xs cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Siswa
            </Button>
          ) : (
            <Button
              onClick={handleOpenCreateCourse}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 h-8 shadow-xs cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Mapel
            </Button>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={
              activeSubTab === "guru"
                ? "Cari Guru berdasarkan Nama, NIP, atau Email..."
                : activeSubTab === "siswa"
                ? "Cari Siswa berdasarkan Nama, NIS, atau Email..."
                : "Cari Mata Pelajaran atau Guru Pengampu..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-xs rounded-xl border-slate-200"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAllData}
          disabled={isLoading}
          className="rounded-full text-xs h-8 px-3 gap-1.5 cursor-pointer text-slate-500"
          title="Segarkan Data"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline text-xs">Segarkan Data</span>
        </Button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <Table className="w-full text-xs sm:text-sm">
          <TableHeader className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
            <TableRow>
              <TableHead className="py-3 px-4 w-12">NO</TableHead>
              {activeSubTab === "guru" && <TableHead className="py-3 px-4">NIP RESMI</TableHead>}
              {activeSubTab === "siswa" && <TableHead className="py-3 px-4">NIS RESMI</TableHead>}
              {activeSubTab === "mapel" && <TableHead className="py-3 px-4">NAMA MATA PELAJARAN</TableHead>}

              {activeSubTab !== "mapel" && <TableHead className="py-3 px-4">NAMA LENGKAP</TableHead>}
              {activeSubTab === "mapel" && <TableHead className="py-3 px-4">GURU PENGAMPU</TableHead>}

              {activeSubTab !== "mapel" && <TableHead className="py-3 px-4">EMAIL TERDAFTAR</TableHead>}
              {activeSubTab === "mapel" && <TableHead className="py-3 px-4">DESKRIPSI MAPEL</TableHead>}

              <TableHead className="py-3 px-4 text-center">STATUS</TableHead>
              <TableHead className="py-3 px-4 text-right">AKSI</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="py-4 px-4">
                    <Skeleton className="h-6 w-full rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : activeSubTab === "guru" ? (
              filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {search ? "Tidak ada guru yang cocok dengan pencarian." : "Belum ada guru terdaftar."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((t, idx) => (
                  <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</TableCell>
                    <TableCell className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">
                      {t.nomor_induk || t.nim_nip}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-brand-50 text-brand-700 font-bold text-xs">
                            {t.name ? t.name.charAt(0) : "G"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-slate-900">{t.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-slate-500 text-xs">{t.email}</TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5">
                        Aktif
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditTeacher(t)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-brand-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit Guru"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete("guru", t)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )
            ) : activeSubTab === "siswa" ? (
              filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {search ? "Tidak ada siswa yang cocok dengan pencarian." : "Belum ada siswa terdaftar."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((s, idx) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</TableCell>
                    <TableCell className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">
                      {s.nomor_induk || s.nim_nip}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-xs">
                            {s.name ? s.name.charAt(0) : "S"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-slate-500 text-xs">{s.email}</TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5">
                        Aktif
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditStudent(s)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete("siswa", s)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )
            ) : (
              /* MATA PELAJARAN TABLE */
              filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {search ? "Tidak ada mata pelajaran yang cocok dengan pencarian." : "Belum ada mata pelajaran terdaftar."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((c, idx) => (
                  <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          <BookOpen className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-bold text-slate-900">{c.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-medium text-slate-700">
                      {c.instructor?.name || "Guru Pengampu Belum Ditentukan"}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-slate-500 text-xs max-w-xs truncate">
                      {c.description || "Mata pelajaran kurikulum semester aktif"}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5">
                        Aktif
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditCourse(c)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit Mapel"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete("mapel", c)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Hapus Mapel"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Teacher Modal (Create & Edit) */}
      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={fetchAllData}
        teacherToEdit={teacherToEdit}
      />

      {/* Student Modal (Create & Edit) */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSuccess={fetchAllData}
        studentToEdit={studentToEdit}
      />

      {/* Course Modal (Create & Edit Mata Pelajaran) */}
      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        onSuccess={fetchAllData}
        courseToEdit={courseToEdit}
        teachers={teachers}
      />

      {/* Delete Confirmation Alert Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={
          itemToDelete?.type === "guru"
            ? "Hapus Data Guru"
            : itemToDelete?.type === "siswa"
            ? "Hapus Data Siswa"
            : "Hapus Mata Pelajaran"
        }
        description={
          itemToDelete?.type === "guru"
            ? "Apakah Anda yakin ingin menghapus akun guru ini dari sistem database? Seluruh hak akses guru akan dinonaktifkan."
            : itemToDelete?.type === "siswa"
            ? "Apakah Anda yakin ingin menghapus akun siswa ini dari sistem database? Data ujian dan evaluasi siswa ini juga akan terhapus."
            : "Apakah Anda yakin ingin menghapus mata pelajaran ini dari kurikulum? Seluruh bahan ajar yang terhubung akan dinonaktifkan."
        }
        itemName={
          itemToDelete
            ? itemToDelete.type === "mapel"
              ? itemToDelete.data.title
              : `${itemToDelete.data.name} (${itemToDelete.type === "guru" ? "NIP" : "NIS"}: ${
                  itemToDelete.data.nomor_induk || itemToDelete.data.nim_nip
                })`
            : ""
        }
        isLoading={isDeleting}
      />
    </Card>
  );
}
