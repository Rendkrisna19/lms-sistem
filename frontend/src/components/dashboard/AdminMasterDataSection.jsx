import { useState } from "react";
import { Plus, Edit, Trash2, Users, GraduationCap, BookMarked, Search, RefreshCw, BookOpen } from "lucide-react";
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
import { useAdminResource } from "../../features/admin/useAdminResource";
import { useAdminDelete } from "../../features/admin/useAdminDelete";

const TABS = {
  guru: { placeholder: "Cari Guru berdasarkan Nama, NIP, atau Email...", deleteTitle: "Hapus Data Guru", noun: "Data Guru" },
  siswa: { placeholder: "Cari Siswa berdasarkan Nama, NIS, atau Email...", deleteTitle: "Hapus Data Siswa", noun: "Data Siswa" },
  mapel: { placeholder: "Cari Mata Pelajaran atau Guru Pengampu...", deleteTitle: "Hapus Mata Pelajaran", noun: "Mata Pelajaran" },
};

const DELETE_DESCRIPTIONS = {
  guru: "Apakah Anda yakin ingin menghapus akun guru ini dari sistem database? Seluruh hak akses guru akan dinonaktifkan.",
  siswa: "Apakah Anda yakin ingin menghapus akun siswa ini dari sistem database? Data ujian dan evaluasi siswa ini juga akan terhapus.",
  mapel: "Apakah Anda yakin ingin menghapus mata pelajaran ini dari kurikulum? Seluruh bahan ajar yang terhubung akan dinonaktifkan.",
};

const TAB_BUTTON_BASE = "px-3.5 py-1.5 rounded-full font-semibold transition-all cursor-pointer";
const TAB_BUTTON_ACTIVE = "bg-white text-blue-700 shadow-xs font-bold";
const TAB_BUTTON_IDLE = "text-slate-500 hover:text-slate-800";

/** Manajemen guru, siswa, dan mata pelajaran untuk admin sekolah (dan admin master bila sekolah dipilih). */
export function AdminMasterDataSection({ onDataUpdated, onNavigateTab }) {
  const [activeSubTab, setActiveSubTab] = useState("guru");
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState(null); // { type: "guru" | "siswa" | "mapel", item }

  const teachers = useAdminResource("teachers");
  const students = useAdminResource("students");
  const courses = useAdminResource("courses");
  const { canWrite, writeParams } = teachers;
  const isLoading = teachers.isLoading || students.isLoading || courses.isLoading;

  const reloadAll = () => {
    teachers.reload();
    students.reload();
    courses.reload();
    onDataUpdated?.();
  };

  const del = useAdminDelete({ writeParams, onDeleted: reloadAll });

  const requestDelete = (type, item) => {
    const { noun } = TABS[type];
    const resource = { guru: "teachers", siswa: "students", mapel: "courses" }[type];
    del.requestDelete({
      kind: type,
      resource,
      id: item.id,
      name: type === "mapel" ? item.title : item.name,
      number: item.nomor_induk || item.nim_nip,
      noun,
    });
  };

  const isFormOpen = (type) => formState?.type === type;
  const formItem = formState?.item ?? null;
  const closeForm = () => setFormState(null);

  const q = search.toLowerCase();
  const matches = (...values) => values.some((value) => (value || "").toLowerCase().includes(q));
  const filteredTeachers = teachers.rows.filter((t) => matches(t.name, t.nomor_induk || t.nim_nip, t.email));
  const filteredStudents = students.rows.filter((s) => matches(s.name, s.nomor_induk || s.nim_nip, s.email));
  const filteredCourses = courses.rows.filter((c) => matches(c.title, c.instructor?.name, c.description));

  const switchTab = (tab) => {
    setActiveSubTab(tab);
    setSearch("");
  };

  const tabButtonClass = (tab) => `${TAB_BUTTON_BASE} ${activeSubTab === tab ? TAB_BUTTON_ACTIVE : TAB_BUTTON_IDLE}`;
  const columnCount = canWrite ? 6 : 5;
  const createLabel = { guru: "Tambah Guru", siswa: "Tambah Siswa", mapel: "Tambah Mapel" }[activeSubTab];

  const renderRows = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={columnCount} className="py-4 px-4">
            <Skeleton className="h-6 w-full rounded-lg" />
          </TableCell>
        </TableRow>
      ));
    }

    const emptyRow = (text) => (
      <TableRow>
        <TableCell colSpan={columnCount} className="py-8 text-center text-slate-400 text-xs">
          {text}
        </TableCell>
      </TableRow>
    );

    const actions = (type, item, editTitle, deleteTitle) =>
      canWrite && (
        <TableCell className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormState({ type, item })}
              className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
              title={editTitle}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => requestDelete(type, item)}
              className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              title={deleteTitle}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      );

    if (activeSubTab === "guru") {
      if (filteredTeachers.length === 0) return emptyRow(search ? "Tidak ada guru yang cocok dengan pencarian." : "Belum ada guru terdaftar.");
      return filteredTeachers.map((t, idx) => (
        <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
          <TableCell className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</TableCell>
          <TableCell className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">{t.nomor_induk || t.nim_nip}</TableCell>
          <TableCell className="py-3.5 px-4">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-brand-50 text-brand-700 font-bold text-xs">{t.name ? t.name.charAt(0) : "G"}</AvatarFallback>
              </Avatar>
              <span className="font-bold text-slate-900">{t.name}</span>
            </div>
          </TableCell>
          <TableCell className="py-3.5 px-4 text-slate-500 text-xs">{t.email}</TableCell>
          <TableCell className="py-3.5 px-4 text-center">
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5">Aktif</Badge>
          </TableCell>
          {actions("guru", t, "Edit Guru", "Hapus Guru")}
        </TableRow>
      ));
    }

    if (activeSubTab === "siswa") {
      if (filteredStudents.length === 0) return emptyRow(search ? "Tidak ada siswa yang cocok dengan pencarian." : "Belum ada siswa terdaftar.");
      return filteredStudents.map((s, idx) => (
        <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
          <TableCell className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</TableCell>
          <TableCell className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">{s.nomor_induk || s.nim_nip}</TableCell>
          <TableCell className="py-3.5 px-4">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-xs">{s.name ? s.name.charAt(0) : "S"}</AvatarFallback>
              </Avatar>
              <span className="font-bold text-slate-900">{s.name}</span>
            </div>
          </TableCell>
          <TableCell className="py-3.5 px-4 text-slate-500 text-xs">{s.email}</TableCell>
          <TableCell className="py-3.5 px-4 text-center">
            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5">Aktif</Badge>
          </TableCell>
          {actions("siswa", s, "Edit Siswa", "Hapus Siswa")}
        </TableRow>
      ));
    }

    if (filteredCourses.length === 0) return emptyRow(search ? "Tidak ada mata pelajaran yang cocok dengan pencarian." : "Belum ada mata pelajaran terdaftar.");
    return filteredCourses.map((c, idx) => (
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
        <TableCell className="py-3.5 px-4 font-medium text-slate-700">{c.instructor?.name || "Belum ada pengampu"}</TableCell>
        <TableCell className="py-3.5 px-4 text-slate-500 text-xs max-w-xs truncate">{c.description || "Belum ada deskripsi."}</TableCell>
        <TableCell className="py-3.5 px-4 text-center">
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2.5 py-0.5">Aktif</Badge>
        </TableCell>
        {actions("mapel", c, "Edit Mapel", "Hapus Mapel")}
      </TableRow>
    ));
  };

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
            <h3 className="text-base font-bold text-slate-900">Manajemen Data Master Akademik</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola data guru pengampu, siswa belajar, dan mata pelajaran kurikulum secara realtime
            </p>
          </div>
        </div>

        {/* Tab Pills & Add Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-full text-xs">
            <button type="button" onClick={() => switchTab("guru")} className={tabButtonClass("guru")}>
              Data Guru ({teachers.rows.length})
            </button>
            <button type="button" onClick={() => switchTab("siswa")} className={tabButtonClass("siswa")}>
              Data Siswa ({students.rows.length})
            </button>
            <button type="button" onClick={() => switchTab("mapel")} className={tabButtonClass("mapel")}>
              Mata Pelajaran ({courses.rows.length})
            </button>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab("kelas")}
                className={`${TAB_BUTTON_BASE} text-slate-600 hover:text-blue-700 hover:bg-white/90`}
                title="Buka Halaman Manajemen Kelas & Plotting Guru"
              >
                Kelas & Plotting →
              </button>
            )}
          </div>

          {canWrite && (
            <Button
              onClick={() => setFormState({ type: activeSubTab, item: null })}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 h-8 shadow-xs cursor-pointer gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {createLabel}
            </Button>
          )}
        </div>
      </div>


      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={TABS[activeSubTab].placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-xs rounded-xl border-slate-200"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={reloadAll}
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
              {canWrite && <TableHead className="py-3 px-4 text-right">AKSI</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">{renderRows()}</TableBody>
        </Table>
      </div>

      <TeacherModal
        isOpen={isFormOpen("guru")}
        onClose={closeForm}
        onSuccess={reloadAll}
        teacherToEdit={formItem}
      />

      <StudentModal
        isOpen={isFormOpen("siswa")}
        onClose={closeForm}
        onSuccess={reloadAll}
        studentToEdit={formItem}
      />

      <CourseModal
        isOpen={isFormOpen("mapel")}
        onClose={closeForm}
        onSuccess={reloadAll}
        courseToEdit={formItem}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(del.target)}
        onClose={del.cancelDelete}
        onConfirm={del.confirmDelete}
        isLoading={del.isDeleting}
        title={del.target ? TABS[del.target.kind].deleteTitle : ""}
        description={del.target ? DELETE_DESCRIPTIONS[del.target.kind] : ""}
        itemName={
          del.target?.kind === "mapel" || !del.target
            ? (del.target?.name ?? "")
            : `${del.target.name} (${del.target.kind === "guru" ? "NIP" : "NIS"}: ${del.target.number})`
        }
      />
    </Card>
  );
}
