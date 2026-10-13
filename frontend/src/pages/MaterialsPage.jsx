import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  FileText,
  Volume2,
  Video,
  CheckCircle2,
  UploadCloud,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Clock,
  AlertTriangle,
  School,
  Building2,
  Layers,
  FileSpreadsheet,
  Link as LinkIcon,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { CustomSelect } from "../components/ui/custom-select";
import { StatCard } from "../components/ui/stat-card";
import { Pagination } from "../components/ui/pagination";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { UploadMaterialModal } from "../components/modals/UploadMaterialModal";
import { MaterialPreviewModal } from "../components/modals/MaterialPreviewModal";
import { ConfirmDeleteModal } from "../components/modals/ConfirmDeleteModal";
import { toast } from "sonner";
import { api } from "../lib/api";

export function MaterialsPage({ currentUser }) {
  const role = currentUser?.role || "murid";
  const isTeacher = role === "guru";

  // Data States
  const [materials, setMaterials] = useState([]);
  const [summary, setSummary] = useState(null);
  const [assignedOptions, setAssignedOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedClassroom, setSelectedClassroom] = useState("all");
  const [selectedContentType, setSelectedContentType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Fetch Teacher Materials
  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      if (isTeacher) {
        const res = await api.get("/teacher/materials", {
          params: {
            teacher_id: currentUser?.id,
          },
        });
        if (res.data?.status === "success") {
          const dt = res.data.data;
          setMaterials(dt.materials || []);
          setSummary(dt.summary || null);
          setAssignedOptions(dt.assigned_options || []);
        }
      } else {
        // Murid / Siswa View
        const res = await api.get("/student/materials");
        if (res.data?.status === "success") {
          setMaterials(res.data.data.materials || []);
        }
      }
    } catch (err) {
      console.error("Gagal memuat bahan ajar:", err);
      toast.error("Gagal mengambil data bahan ajar dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [currentUser?.id, role]);

  // Buka materi. Untuk siswa, akses dicatat ke server sebagai dasar analitik keaktifan
  // (guru, admin sekolah, admin master). Kegagalan pencatatan tidak menghalangi belajar.
  const handleOpenMaterial = (item) => {
    setPreviewMaterial(item);
    if (isTeacher) return;

    api.post(`/student/materials/${item.id}/access`).catch(() => {});
    if (!item.my_access_count) {
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, my_access_count: 1, my_last_accessed_at: new Date().toISOString() } : m
        )
      );
    }
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (item) => {
    setTogglingId(item.id);
    try {
      const res = await api.patch(`/teacher/materials/${item.id}/toggle-status`, {}, {
        params: { teacher_id: currentUser?.id }
      });
      if (res.data?.status === "success") {
        const updated = res.data.data;
        setMaterials((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, is_active: updated.is_active } : m))
        );
        // Update summary counter
        if (summary) {
          setSummary((s) => ({
            ...s,
            total_active: updated.is_active ? s.total_active + 1 : s.total_active - 1,
            total_inactive: updated.is_active ? s.total_inactive - 1 : s.total_inactive + 1,
          }));
        }
        toast.success(res.data.message || `Status materi "${item.title}" diperbarui.`);
      }
    } catch (err) {
      toast.error("Gagal mengubah status bahan ajar.");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Material
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/teacher/materials/${deleteTarget.id}`, {
        params: { teacher_id: currentUser?.id }
      });
      if (res.data?.status === "success") {
        toast.success(res.data.message || "Bahan ajar berhasil dihapus.");
        setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        if (summary) {
          setSummary((s) => ({
            ...s,
            total: Math.max(0, s.total - 1),
            total_document: deleteTarget.content_type === "document" ? Math.max(0, s.total_document - 1) : s.total_document,
            total_audio: deleteTarget.content_type === "audio" ? Math.max(0, s.total_audio - 1) : s.total_audio,
            total_video: deleteTarget.content_type === "video" ? Math.max(0, s.total_video - 1) : s.total_video,
            total_active: deleteTarget.is_active ? Math.max(0, s.total_active - 1) : s.total_active,
            total_inactive: !deleteTarget.is_active ? Math.max(0, s.total_inactive - 1) : s.total_inactive,
          }));
        }
        setDeleteTarget(null);
      }
    } catch (err) {
      toast.error("Gagal menghapus bahan ajar.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Logic
  const filteredMaterials = materials.filter((item) => {
    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCourse = item.course?.title?.toLowerCase().includes(q);
      const matchClass = item.classroom?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCourse && !matchClass) return false;
    }

    // 2. Classroom Filter
    if (selectedClassroom !== "all") {
      if (String(item.classroom_id) !== String(selectedClassroom)) return false;
    }

    // 3. Content Type Filter
    if (selectedContentType !== "all") {
      if (item.content_type !== selectedContentType) return false;
    }

    // 4. Status Filter
    if (selectedStatus !== "all") {
      if (selectedStatus === "active" && !item.is_active) return false;
      if (selectedStatus === "inactive" && item.is_active) return false;
      if (selectedStatus === "expired" && !item.is_expired) return false;
    }

    return true;
  });

  const studiedCount = materials.filter((m) => m.my_access_count > 0).length;

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage) || 1;
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Unique classroom options from assignedOptions
  const classroomOptions = [
    { value: "all", label: "Semua Rombel / Kelas" },
    ...assignedOptions.map((opt) => ({
      value: String(opt.classroom_id),
      label: `${opt.classroom_name} (${opt.classroom_code})`,
    })),
  ];

  const contentTypeOptions = [
    { value: "all", label: "Semua Format Media (3 Model)" },
    { value: "document", label: "Dokumen PDF (Teori)" },
    { value: "audio", label: "Audio Suara (Podcast)" },
    { value: "video", label: "Video Visual (Simulasi)" },
  ];

  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "active", label: "Hanya Aktif" },
    { value: "inactive", label: "Hanya Nonaktif" },
    { value: "expired", label: "Hanya Kadaluarsa" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {isTeacher ? "Bahan Ajar & Modul Pembelajaran (3 Model)" : "Ruang Belajar Digital (3 Model)"}
            </h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
              {isTeacher ? "Role Guru Pengampu" : "Role Siswa"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isTeacher
              ? "Kelola dokumen PDF, podcast audio vokal, dan video simulasi yang ditugaskan khusus untuk rombongan belajar Anda."
              : "Akses materi pembelajaran interaktif sesuai rombongan belajar kelas dan mata pelajaran Anda."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isTeacher && (
            <>
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
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchMaterials}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Segarkan
          </Button>

          {isTeacher && (
            <Button
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Unggah Bahan Ajar
            </Button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Cards for Teacher */}
      {isTeacher && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <Card className="rounded-2xl border border-slate-200/80 p-4 bg-white shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Modul</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{summary.total}</span>
              <span className="text-xs text-slate-400">berkas</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-red-100 p-4 bg-red-50/30 shadow-2xs">
            <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Dokumen PDF
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-red-700">{summary.total_document}</span>
              <span className="text-xs text-red-400">Maks. 20MB</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-indigo-100 p-4 bg-indigo-50/30 shadow-2xs">
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5" /> Audio Suara
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-indigo-700">{summary.total_audio}</span>
              <span className="text-xs text-indigo-400">Maks. 20MB</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-blue-100 p-4 bg-blue-50/30 shadow-2xs">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              <Video className="h-3.5 w-3.5" /> Video Visual
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-blue-700">{summary.total_video}</span>
              <span className="text-xs text-blue-400">Asli / YT / Drive</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-emerald-100 p-4 bg-emerald-50/30 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Status Aktif
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-emerald-700">{summary.total_active}</span>
              <span className="text-xs text-emerald-400">tampil</span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 p-4 bg-slate-50 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Status Nonaktif</span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-600">{summary.total_inactive}</span>
              <span className="text-xs text-slate-400">disembunyikan</span>
            </div>
          </Card>
        </div>
      )}

      {/* 2b. Progres belajar siswa (dari riwayat akses materi) */}
      {!isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Materi Tersedia" value={materials.length} icon={BookOpen} isLoading={isLoading} />
          <StatCard label="Sudah Dipelajari" value={studiedCount} icon={CheckCircle2} tone="emerald" isLoading={isLoading} />
          <StatCard label="Belum Dibuka" value={materials.length - studiedCount} icon={Eye} tone="amber" isLoading={isLoading} />
          <StatCard
            label="Progres Belajar"
            value={materials.length ? Math.round((studiedCount / materials.length) * 100) : 0}
            suffix="%"
            icon={Sparkles}
            tone="indigo"
            isLoading={isLoading}
          />
        </div>
      )}

      {/* 3. Main Table Card */}
      <Card className="rounded-3xl border border-slate-200/80 shadow-xs bg-white overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-4xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari judul materi, deskripsi modul, mapel..."
                className="pl-9 h-10 rounded-xl border-slate-200 text-xs sm:text-sm w-full"
              />
            </div>

            {/* Filter Kelas Rombel */}
            {isTeacher && assignedOptions.length > 0 && (
              <div className="w-full sm:w-56 shrink-0">
                <CustomSelect
                  value={selectedClassroom}
                  onChange={(val) => {
                    setSelectedClassroom(val);
                    setCurrentPage(1);
                  }}
                  options={classroomOptions}
                />
              </div>
            )}

            {/* Filter Format Media */}
            <div className="w-full sm:w-52 shrink-0">
              <CustomSelect
                value={selectedContentType}
                onChange={(val) => {
                  setSelectedContentType(val);
                  setCurrentPage(1);
                }}
                options={contentTypeOptions}
              />
            </div>

            {/* Filter Status Aktif/Nonaktif */}
            {isTeacher && (
              <div className="w-full sm:w-44 shrink-0">
                <CustomSelect
                  value={selectedStatus}
                  onChange={(val) => {
                    setSelectedStatus(val);
                    setCurrentPage(1);
                  }}
                  options={statusOptions}
                />
              </div>
            )}
          </div>

          <span className="text-xs text-slate-400 font-medium shrink-0">
            Total Ditemukan: <strong className="text-slate-700">{filteredMaterials.length} Modul</strong>
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
              <TableRow>
                <TableHead className="py-3 px-4 w-12 text-center">NO</TableHead>
                <TableHead className="py-3 px-4">FORMAT & MODEL</TableHead>
                <TableHead className="py-3 px-4">JUDUL MODUL & DESKRIPSI</TableHead>
                <TableHead className="py-3 px-4">KELAS & MAPEL (ROMBEL)</TableHead>
                <TableHead className="py-3 px-4">TANGGAL UNGGAH</TableHead>
                <TableHead className="py-3 px-4">BATAS WAKTU / HILANG</TableHead>
                {isTeacher && <TableHead className="py-3 px-4 text-center">STATUS</TableHead>}
                <TableHead className="py-3 px-4 text-right">AKSI</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-4 px-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></TableCell>
                    <TableCell className="py-4 px-4"><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="py-4 px-4"><Skeleton className="h-4 w-60" /></TableCell>
                    <TableCell className="py-4 px-4"><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell className="py-4 px-4"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="py-4 px-4"><Skeleton className="h-4 w-28" /></TableCell>
                    {isTeacher && <TableCell className="py-4 px-4 text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableCell>}
                    <TableCell className="py-4 px-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isTeacher ? 8 : 7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Tidak ada bahan ajar ditemukan</span>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {isTeacher
                          ? "Belum ada berkas modul pembelajaran yang diunggah sesuai kriteria filter pencarian Anda."
                          : "Belum ada materi pembelajaran yang aktif di kelas Anda saat ini."}
                      </p>
                      {isTeacher && (
                        <Button
                          size="sm"
                          onClick={() => setIsUploadModalOpen(true)}
                          className="mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Unggah Modul Sekarang
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMaterials.map((item, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const isPdf = item.content_type === "document";
                  const isAudio = item.content_type === "audio";
                  const isVideo = item.content_type === "video";
                  const isExpired = item.is_expired;

                  return (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !item.is_active ? "opacity-60 bg-slate-50/40" : ""
                      }`}
                    >
                      {/* NO */}
                      <TableCell className="py-4 px-4 text-center font-mono text-xs text-slate-400">
                        {itemNumber}
                      </TableCell>

                      {/* FORMAT & MODEL */}
                      <TableCell className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {isPdf && (
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 text-[11px] font-bold gap-1 px-2.5 py-1"
                            >
                              <FileText className="h-3.5 w-3.5 text-red-600" />
                              <span>Dokumen PDF</span>
                            </Badge>
                          )}
                          {isAudio && (
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-bold gap-1 px-2.5 py-1"
                            >
                              <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Audio Suara</span>
                            </Badge>
                          )}
                          {isVideo && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-bold gap-1 px-2.5 py-1"
                            >
                              <Video className="h-3.5 w-3.5 text-blue-600" />
                              <span>
                                {item.video_source_type === "youtube"
                                  ? "Video YouTube"
                                  : item.video_source_type === "google_drive"
                                  ? "Video G-Drive"
                                  : "Video Asli"}
                              </span>
                            </Badge>
                          )}

                          {item.formatted_file_size && (
                            <span className="text-[10px] text-slate-400 font-mono pl-1">
                              {item.formatted_file_size}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* JUDUL & DESKRIPSI */}
                      <TableCell className="py-4 px-4">
                        <div className="max-w-md">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                            {item.title}
                          </h4>
                          {!isTeacher && (
                            item.my_access_count > 0 ? (
                              <Badge variant="success" className="mt-1 text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Sudah dipelajari
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="mt-1 text-[10px]">Belum dibuka</Badge>
                            )
                          )}
                          {item.description ? (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-1 italic">
                              Tidak ada deskripsi tambahan.
                            </p>
                          )}
                          {item.file_name_original && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                              <span className="truncate max-w-[280px]">Berkas: {item.file_name_original}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* KELAS & MAPEL */}
                      <TableCell className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">
                            {item.classroom?.name || "Semua Kelas"}
                          </span>
                          <span className="text-[11px] text-blue-600 font-semibold mt-0.5">
                            {item.course?.title || "Mata Pelajaran"}
                          </span>
                          {item.classroom?.code && (
                            <Badge variant="secondary" className="w-fit text-[10px] font-mono mt-1 px-1.5 py-0 bg-slate-100 text-slate-600">
                              {item.classroom?.code}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* TANGGAL UPLOAD */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 pl-5 block">
                          {new Date(item.created_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} WIB
                        </span>
                      </TableCell>

                      {/* BATAS WAKTU / KAPAN HILANG */}
                      <TableCell className="py-4 px-4 whitespace-nowrap">
                        {item.expires_at ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              <span className={isExpired ? "text-red-600 font-bold" : "text-slate-700 font-medium"}>
                                {new Date(item.expires_at).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            {isExpired ? (
                              <Badge className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-1.5 py-0 mt-1 w-fit font-bold">
                                Sudah Kadaluarsa
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-slate-400 pl-5 mt-0.5">
                                {new Date(item.expires_at).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                WIB
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-medium">
                            Tanpa Batas Waktu
                          </Badge>
                        )}
                      </TableCell>

                      {/* STATUS (Aktif / Nonaktif Toggle) */}
                      {isTeacher && (
                        <TableCell className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            disabled={togglingId === item.id}
                            title="Klik untuk mengubah status materi"
                            className="inline-flex items-center gap-1.5 cursor-pointer group transition-all"
                          >
                            <Badge
                              variant="outline"
                              className={`text-[11px] font-bold px-2.5 py-1 transition-all ${
                                item.is_active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200 group-hover:bg-slate-200"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full mr-1.5 ${
                                  item.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                }`}
                              />
                              {item.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </button>
                        </TableCell>
                      )}

                      {/* AKSI */}
                      <TableCell className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Preview / Buka Media */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMaterial(item)}
                            title="Lihat / Putar Berkas"
                            className="h-8 px-2.5 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer text-xs gap-1 font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Buka</span>
                          </Button>

                          {/* Tombol Toggle Status (Guru) */}
                          {isTeacher && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(item)}
                              disabled={togglingId === item.id}
                              title={item.is_active ? "Nonaktifkan Materi" : "Aktifkan Materi"}
                              className={`h-8 px-2 rounded-xl cursor-pointer text-xs ${
                                item.is_active
                                  ? "text-slate-500 hover:text-amber-700 hover:bg-amber-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {item.is_active ? (
                                <ToggleRight className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="h-4 w-4 text-slate-400" />
                              )}
                            </Button>
                          )}

                          {/* Tombol Hapus (Guru) */}
                          {isTeacher && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(item)}
                              title="Hapus Bahan Ajar"
                              className="h-8 px-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Menampilkan {paginatedMaterials.length} dari {filteredMaterials.length} bahan ajar
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* 4. Modals */}
      {/* Upload Modal */}
      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchMaterials}
        assignedOptions={assignedOptions}
        currentUser={currentUser}
      />

      {/* Preview Modal */}
      <MaterialPreviewModal
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        material={previewMaterial}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Bahan Ajar"
        description="Apakah Anda yakin ingin menghapus materi modul pembelajaran ini? Berkas yang telah dihapus tidak dapat dipulihkan."
        itemName={deleteTarget?.title}
        isLoading={isDeleting}
      />
    </div>
  );
}
