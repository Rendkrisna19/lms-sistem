import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  BarChart3,
  GraduationCap,
  Users,
  School as SchoolIcon,
  BookMarked,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { Pagination } from "../components/ui/pagination";
import { SchoolModal } from "../components/modals/SchoolModal";
import { SchoolAnalyticsModal } from "../components/modals/SchoolAnalyticsModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { api } from "../lib/api";
import { toast } from "sonner";

export function SchoolsPage({ currentUser }) {
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [schoolToEdit, setSchoolToEdit] = useState(null);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedSchoolForAnalytics, setSelectedSchoolForAnalytics] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/admin/schools");
      if (res.data?.status === "success") {
        setSchools(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat daftar sekolah dari server Cendekia.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleOpenCreate = () => {
    setSchoolToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (school) => {
    setSchoolToEdit(school);
    setIsFormModalOpen(true);
  };

  const handleOpenAnalytics = (school) => {
    setSelectedSchoolForAnalytics(school);
    setIsAnalyticsModalOpen(true);
  };

  const handleOpenDelete = (school) => {
    setSchoolToDelete(school);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/schools/${schoolToDelete.id}`);
      if (res.data?.status === "success") {
        toast.success(`Sekolah "${schoolToDelete.name}" berhasil dihapus.`);
        setIsDeleteModalOpen(false);
        fetchSchools();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus data sekolah.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Schools
  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.npsn?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage) || 1;
  const paginatedSchools = filteredSchools.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const totalStudents = schools.reduce((acc, s) => acc + (s.students_count || 0), 0);
  const totalTeachers = schools.reduce((acc, s) => acc + (s.teachers_count || 0), 0);
  const totalClassrooms = schools.reduce((acc, s) => acc + (s.classrooms_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Data Sekolah
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar sekolah yang terdaftar di platform Cendekia.
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
            onClick={fetchSchools}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 cursor-pointer text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Sekolah
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Sekolah Terdaftar</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{schools.length}</div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">Sekolah aktif</p>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Siswa</span>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStudents}</div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">Siswa terdaftar</p>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Guru</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalTeachers}</div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">Guru terdaftar</p>
        </Card>

        <Card className="p-4 rounded-2xl border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Kelas</span>
            <SchoolIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalClassrooms}</div>
          <p className="text-[11px] text-blue-600 mt-1 font-medium">Kelas terdaftar</p>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-3xl border-slate-200/80 bg-white overflow-hidden shadow-xs">
        {/* Table Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari sekolah, NPSN, atau alamat..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
              />
            </div>
            <div className="w-44 shrink-0">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "all", label: "Semua Status" },
                  { value: "active", label: "Status: Aktif" },
                  { value: "inactive", label: "Status: Nonaktif" },
                ]}
                searchable={false}
              />
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium shrink-0">
            Menampilkan: <strong className="text-slate-700">{filteredSchools.length} Sekolah</strong>
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table className="w-full text-xs sm:text-sm">
            <TableHeader className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
              <TableRow>
                <TableHead className="py-3 px-4 w-14">ID</TableHead>
                <TableHead className="py-3 px-4">NAMA SEKOLAH</TableHead>
                <TableHead className="py-3 px-4">NPSN & JENJANG</TableHead>
                <TableHead className="py-3 px-4">STATISTIK DATA</TableHead>
                <TableHead className="py-3 px-4">KONTAK & ALAMAT</TableHead>
                <TableHead className="py-3 px-4 text-center">STATUS</TableHead>
                <TableHead className="py-3 px-4 text-right">AKSI</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="py-4 px-4">
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {search ? "Tidak ada sekolah yang cocok dengan pencarian." : "Belum ada sekolah terdaftar."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSchools.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID Sekolah */}
                    <TableCell className="py-3.5 px-4 font-bold">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        #{s.id}
                      </span>
                    </TableCell>

                    {/* Nama Sekolah */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {s.name}
                          </p>
                          <p className="text-[11px] text-blue-600 mt-0.5 truncate max-w-[220px]" title={s.admin ? `Admin: ${s.admin.name} (${s.admin.email})` : "Belum ada akun admin"}>
                            {s.admin ? `Admin: ${s.admin.email}` : "Admin belum diatur"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* NPSN & Jenjang */}
                    <TableCell className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="font-mono text-xs text-slate-700 font-semibold block">
                          {s.npsn || "Tanpa NPSN"}
                        </span>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-bold">
                          {s.jenjang || "SMA"}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Statistik Murid / Guru / Kelas */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md" title="Total Murid">
                          <GraduationCap className="h-3 w-3" /> {s.students_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md" title="Total Guru">
                          <Users className="h-3 w-3" /> {s.teachers_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md" title="Total Rombel Kelas">
                          <SchoolIcon className="h-3 w-3" /> {s.classrooms_count || 0}
                        </span>
                      </div>
                    </TableCell>

                    {/* Kontak & Alamat */}
                    <TableCell className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-600 truncate" title={s.address || "-"}>
                        {s.address || "-"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {s.phone || s.email || "-"}
                      </p>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5 px-4 text-center">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-semibold ${
                          s.status === "active"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {s.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol Analisa Murid Sekolah */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAnalytics(s)}
                          className="h-8 px-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold cursor-pointer gap-1"
                          title="Analisa Murid Sekolah"
                        >
                          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Analitik Murid</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Edit Sekolah"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(s)}
                          className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Hapus Sekolah"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSchools.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          itemName="sekolah"
        />
      </Card>

      {/* Modal Tambah / Edit Sekolah */}
      <SchoolModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchSchools}
        schoolToEdit={schoolToEdit}
      />

      {/* Modal Analitik Murid Sekolah */}
      <SchoolAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        school={selectedSchoolForAnalytics}
      />

      {/* Modal Konfirmasi Hapus Sekolah */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Hapus Data Sekolah?"
        description={`Apakah Anda yakin ingin menghapus "${schoolToDelete?.name}" dari platform Cendekia? Semua asosiasi guru, murid, dan kelas terkait sekolah ini akan terhapus.`}
      />
    </div>
  );
}
