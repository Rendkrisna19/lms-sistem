import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, Search, ShieldCheck, Mail, RefreshCw, Building2, FileSpreadsheet, FileText } from "lucide-react";
import { Card } from "../components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { Pagination } from "../components/ui/pagination";
import { TeacherModal } from "../components/modals/TeacherModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { api } from "../lib/api";
import { toast } from "sonner";

export function TeachersPage({ currentUser }) {
  const isAdminMaster = currentUser?.role === "admin_master";

  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
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

  // Fetch teachers based on role & selected school
  const fetchTeachers = async (schoolId = selectedSchool) => {
    try {
      setIsLoading(true);
      const url = isAdminMaster
        ? (schoolId === "all" ? "/master/teachers" : `/master/teachers?school_id=${schoolId}`)
        : "/admin/teachers";

      const res = await api.get(url);
      if (res.data?.data) {
        setTeachers(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat data guru dari server backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminMaster) {
      fetchSchools();
    }
    fetchTeachers("all");
  }, [isAdminMaster]);

  const handleSchoolFilterChange = (val) => {
    setSelectedSchool(val);
    setCurrentPage(1);
    fetchTeachers(val);
  };

  // Open Create Modal (Only available for school admin)
  const handleOpenCreate = () => {
    setTeacherToEdit(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (teacher) => {
    setTeacherToEdit(teacher);
    setIsFormModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;

    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/teachers/${teacherToDelete.id}`);
      if (res.data?.status === "success") {
        toast.success(`Data Guru "${teacherToDelete.name}" berhasil dihapus.`);
        setIsDeleteModalOpen(false);
        setTeacherToDelete(null);
        fetchTeachers(selectedSchool);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus data guru.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = search.toLowerCase();
    const nameMatch = (t.name || "").toLowerCase().includes(q);
    const nipMatch = (t.nomor_induk || t.nim_nip || "").toLowerCase().includes(q);
    const emailMatch = (t.email || "").toLowerCase().includes(q);
    return nameMatch || nipMatch || emailMatch;
  });

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage) || 1;
  const paginatedTeachers = filteredTeachers.slice(
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
                <Users className="h-4 w-4" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Data Guru
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daftar guru pengampu yang terdaftar di sekolah.
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
              onClick={() => fetchTeachers(selectedSchool)}
              disabled={isLoading}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Segarkan
            </Button>

            {/* ONLY School Admin can create teacher, Admin Master does NOT create */}
            {!isAdminMaster && (
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Tambah Guru
              </Button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1 max-w-lg">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama guru, NIP, email..."
                className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
              />
            </div>

            {/* School Filter Dropdown (Active for Admin Master) */}
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

          <span className="text-xs text-slate-400 font-medium shrink-0">
            Total: <strong className="text-slate-700">{filteredTeachers.length} Guru</strong>
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <Table className="w-full text-xs sm:text-sm">
            <TableHeader className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
              <TableRow>
                <TableHead className="py-3 px-4 w-12">NO</TableHead>
                <TableHead className="py-3 px-4">NIP</TableHead>
                <TableHead className="py-3 px-4">NAMA GURU</TableHead>
                {isAdminMaster && <TableHead className="py-3 px-4">SEKOLAH</TableHead>}
                <TableHead className="py-3 px-4">EMAIL</TableHead>
                <TableHead className="py-3 px-4 text-center">STATUS</TableHead>
                {!isAdminMaster && <TableHead className="py-3 px-4 text-right">AKSI</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdminMaster ? 6 : 6} className="py-4 px-4">
                      <Skeleton className="h-6 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdminMaster ? 6 : 6} className="py-8 text-center text-slate-400 text-xs">
                    {search ? "Tidak ada guru yang cocok dengan pencarian." : "Belum ada data guru terdaftar."}
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
                        <Avatar className="h-8 w-8 ring-1 ring-blue-100">
                          <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                            {t.name ? t.name.charAt(0) : "G"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-slate-800">{t.name}</span>
                      </div>
                    </TableCell>

                    {/* Sekolah Mitra (Visible for Admin Master) */}
                    {isAdminMaster && (
                      <TableCell className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[11px] font-semibold text-blue-700 bg-blue-50 border-blue-200">
                          {t.school?.name || "SMA Mitra Inalum"}
                        </Badge>
                      </TableCell>
                    )}

                    <TableCell className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      {t.email}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold">
                        Aktif Mengajar
                      </Badge>
                    </TableCell>

                    {/* Aksi hanya untuk Admin Sekolah */}
                    {!isAdminMaster && (
                      <TableCell className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(t)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Edit Guru"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(t)}
                            className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Hapus Guru"
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
      </Card>

      {/* Modal Tambah / Edit Guru (School Admin) */}
      {!isAdminMaster && (
        <TeacherModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => fetchTeachers(selectedSchool)}
          teacherToEdit={teacherToEdit}
        />
      )}

      {/* Modal Konfirmasi Hapus Guru */}
      {!isAdminMaster && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title="Hapus Data Guru?"
          description={`Apakah Anda yakin ingin menghapus data guru "${teacherToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        />
      )}
    </div>
  );
}
