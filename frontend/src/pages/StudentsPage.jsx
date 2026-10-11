import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, GraduationCap, Search, RefreshCw, School, Building2, FileSpreadsheet, FileText } from "lucide-react";
import { Card } from "../components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { Pagination } from "../components/ui/pagination";
import { StudentModal } from "../components/modals/StudentModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { api } from "../lib/api";
import { toast } from "sonner";

export function StudentsPage({ currentUser }) {
  const isAdminMaster = currentUser?.role === "admin_master";

  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
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

  // Fetch real students & classrooms
  const fetchStudents = async (schoolId = selectedSchool) => {
    try {
      setIsLoading(true);
      const studentsUrl = isAdminMaster
        ? (schoolId === "all" ? "/master/students" : `/master/students?school_id=${schoolId}`)
        : "/admin/students";

      const classroomsUrl = isAdminMaster
        ? (schoolId === "all" ? "/master/classrooms" : `/master/classrooms?school_id=${schoolId}`)
        : "/admin/classrooms";

      try {
        const resStudents = await api.get(studentsUrl);
        if (resStudents.data?.data) {
          setStudents(resStudents.data.data);
        }
      } catch (studentErr) {
        toast.error("Gagal memuat data siswa.");
      }

      try {
        const resClasses = await api.get(classroomsUrl);
        if (resClasses.data?.data) {
          setClassrooms(resClasses.data.data);
        }
      } catch (classErr) {
        console.warn("Could not load classrooms for filter:", classErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminMaster) {
      fetchSchools();
    }
    fetchStudents("all");
  }, [isAdminMaster]);

  const handleSchoolFilterChange = (val) => {
    setSelectedSchool(val);
    setCurrentPage(1);
    fetchStudents(val);
  };

  const handleOpenCreate = () => {
    setStudentToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setStudentToEdit(student);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/students/${studentToDelete.id}`);
      if (res.data?.status === "success") {
        toast.success(`Data Siswa "${studentToDelete.name}" berhasil dihapus.`);
        setIsDeleteModalOpen(false);
        setStudentToDelete(null);
        fetchStudents(selectedSchool);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus data siswa.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const nameMatch = (s.name || "").toLowerCase().includes(q);
    const nisMatch = (s.nomor_induk || s.nim_nip || "").toLowerCase().includes(q);
    const emailMatch = (s.email || "").toLowerCase().includes(q);

    const classMatch =
      filterClass === "all" ||
      (filterClass === "unassigned" ? !s.classroom_id : String(s.classroom_id) === String(filterClass));

    return (nameMatch || nisMatch || emailMatch) && classMatch;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
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
      {/* Header Banner */}
      <Card className="bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <GraduationCap className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Data Siswa
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daftar siswa yang terdaftar di sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Fitur Export Excel akan segera tersedia.")}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9 gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Fitur Export PDF akan segera tersedia.")}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9 gap-1.5"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>Export PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStudents(selectedSchool)}
              disabled={isLoading}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>

            {/* ONLY School Admin can create student, Admin Master does NOT create */}
            {!isAdminMaster && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Tambah Siswa
              </Button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari siswa, NIS, email..."
                className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
              />
            </div>

            {/* School Filter Dropdown (Active for Admin Master) */}
            {isAdminMaster && (
              <div className="w-full sm:w-52">
                <CustomSelect
                  value={selectedSchool}
                  onChange={handleSchoolFilterChange}
                  options={schoolOptions}
                  placeholder="Filter Sekolah"
                  icon={Building2}
                />
              </div>
            )}

            {/* Class Filter */}
            <div className="w-full sm:w-48">
              <CustomSelect
                value={filterClass}
                onChange={(val) => {
                  setFilterClass(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "Semua Kelas" },
                  { value: "unassigned", label: "Belum Punya Kelas" },
                  ...classrooms.map((c) => ({
                    value: c.id,
                    label: `${c.name} (${c.code})`,
                  })),
                ]}
                placeholder="Filter Kelas"
                icon={School}
              />
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium shrink-0">
            Total: <strong className="text-slate-700">{filteredStudents.length} Siswa</strong>
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <Table className="w-full text-xs sm:text-sm">
            <TableHeader className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
              <TableRow>
                <TableHead className="py-3 px-4 w-12">NO</TableHead>
                <TableHead className="py-3 px-4">NIS</TableHead>
                <TableHead className="py-3 px-4">NAMA SISWA</TableHead>
                {isAdminMaster && <TableHead className="py-3 px-4">SEKOLAH</TableHead>}
                <TableHead className="py-3 px-4">KELAS</TableHead>
                <TableHead className="py-3 px-4">EMAIL</TableHead>
                <TableHead className="py-3 px-4 text-center">STATUS</TableHead>
                {!isAdminMaster && <TableHead className="py-3 px-4 text-right">AKSI</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdminMaster ? 7 : 7} className="py-4 px-4">
                      <Skeleton className="h-6 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdminMaster ? 7 : 7} className="py-8 text-center text-slate-400 text-xs">
                    {search ? "Tidak ada siswa yang cocok dengan pencarian." : "Belum ada data siswa terdaftar."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStudents.map((s, idx) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3.5 px-4 font-bold text-slate-400">
                      {((currentPage - 1) * itemsPerPage) + idx + 1}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">
                      {s.nomor_induk || s.nim_nip}
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 ring-1 ring-blue-100">
                          <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                            {s.name ? s.name.charAt(0) : "S"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-800">{s.name}</span>
                      </div>
                    </TableCell>

                    {/* Sekolah Mitra (Visible for Admin Master) */}
                    {isAdminMaster && (
                      <TableCell className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[11px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                          {s.school?.name || "SMA Mitra Inalum"}
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell className="py-3.5 px-4">
                      {s.classroom ? (
                        <Badge variant="outline" className="text-[11px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                          {s.classroom.name} ({s.classroom.code})
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Belum diplot</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {s.email}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold">
                        Siswa Aktif
                      </Badge>
                    </TableCell>

                    {/* Aksi hanya untuk Admin Sekolah */}
                    {!isAdminMaster && (
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(s)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Edit Siswa"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(s)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStudents.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="siswa"
        />
      </Card>

      {/* Modal Tambah / Edit Siswa (School Admin) */}
      {!isAdminMaster && (
        <StudentModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => fetchStudents(selectedSchool)}
          studentToEdit={studentToEdit}
          classrooms={classrooms}
        />
      )}

      {/* Modal Konfirmasi Hapus Siswa */}
      {!isAdminMaster && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title="Hapus Data Siswa?"
          description={`Apakah Anda yakin ingin menghapus data siswa "${studentToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        />
      )}
    </div>
  );
}
