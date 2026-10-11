import React from "react";
import { Activity, Award, CheckCircle2, Users, GraduationCap, BookMarked } from "lucide-react";
import { Card } from "../ui/card";

export function KpiCards({ role, overview, teachersCount = 3, studentsCount = 4, onNavigateTab }) {
  const isTeacher = role === "guru";
  const isAdmin = role === "admin";
  const isStudent = role === "murid";

  const totalTeachers = overview?.total_teachers ?? teachersCount;
  const totalStudents = overview?.total_students ?? studentsCount;
  const totalCourses = overview?.total_courses ?? 3;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
      {/* Card 1: Highlighted Active Royal Blue Card (Medlio Signature) */}
      <Card
        onClick={() => onNavigateTab && onNavigateTab(isAdmin ? "statistik" : isTeacher ? "ujian" : "ruang_belajar")}
        className="bg-[#2563EB] text-white rounded-3xl p-5 shadow-lg shadow-blue-500/15 border-none flex flex-col justify-between relative overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.01] transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">
            {isAdmin ? "Aktivitas Hari Ini" : isTeacher ? "Kuis Aktif Berjalan" : "Progres Belajar Saya"}
          </span>
          <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-white group-hover:text-brand-600 transition-colors">
            {isAdmin ? <Activity className="h-4 w-4" /> : isTeacher ? <Award className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-white tracking-tight">
            {isAdmin ? "142" : isTeacher ? "1 Kuis" : "100%"}
          </h3>
          <p className="text-xs text-blue-100 mt-1 font-medium">
            {isAdmin ? "Sesi Login Terjadwal" : isTeacher ? "Pertemuan 1 • Berjalan" : "Semua Modul Tuntas (Lihat →)"}
          </p>
        </div>
      </Card>

      {/* Card 2: White Card (Shadcn Card) */}
      <Card
        onClick={() => onNavigateTab && onNavigateTab(isAdmin ? "guru" : isTeacher ? "materi" : "ruang_belajar")}
        className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isAdmin ? "Total Guru & Dosen" : isTeacher ? "Bahan Ajar Terunggah" : "Modul Terbuka"}
          </span>
          <div className="h-8 w-8 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAdmin ? `${totalTeachers} Guru` : "3 Model"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAdmin ? "Klik untuk Kelola Guru →" : isTeacher ? "PDF, Audio & Video HD" : "3 Model Ajar Aktif →"}
          </p>
        </div>
      </Card>

      {/* Card 3: White Card (Shadcn Card) */}
      <Card
        onClick={() => onNavigateTab && onNavigateTab(isAdmin ? "siswa" : isTeacher ? "rekap" : "nilai")}
        className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isAdmin ? "Total Siswa / Mhs" : isTeacher ? "Siswa Mengikuti" : "Nilai Kuis Terakhir"}
          </span>
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <GraduationCap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAdmin ? `${totalStudents} Siswa` : isTeacher ? `${totalStudents} Siswa` : "100"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAdmin ? "Klik untuk Kelola Siswa →" : isTeacher ? "Kelas IF-A Terdata" : "Skor Sempurna (Lulus) →"}
          </p>
        </div>
      </Card>

      {/* Card 4: White Card (Shadcn Card) */}
      <Card
        onClick={() => onNavigateTab && onNavigateTab(isAdmin ? "mapel" : isTeacher ? "rekap" : "agenda")}
        className="bg-white border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {isAdmin ? "Mata Pelajaran Aktif" : isTeacher ? "Rata-Rata Kelas" : "Waktu Belajar"}
          </span>
          <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <BookMarked className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isAdmin ? `${totalCourses} Mapel` : isTeacher ? "85.0" : "4j 25m"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isAdmin ? "Klik untuk Kelola Mapel →" : isTeacher ? "75% Tingkat Lulus" : "Minggu Ini (Lihat Agenda →)"}
          </p>
        </div>
      </Card>
    </div>
  );
}
