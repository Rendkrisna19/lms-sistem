import React, { useState } from "react";
import { ChevronDown, Calendar, Download, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../ui/table";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { CustomSelect } from "../ui/custom-select";
import { toast } from "sonner";

const defaultEvaluationData = [
  { id: 1, nis: "20241001", name: "Siswa Belajar (Ahmad Fajar)", kelas: "Teknik Informatika - A", submitTime: "13:30, 10 Okt 2026", nilai: 100, status: "Lulus" },
  { id: 2, nis: "20241002", name: "Siti Aisyah", kelas: "Teknik Informatika - A", submitTime: "14:40, 10 Okt 2026", nilai: 90, status: "Lulus" },
  { id: 3, nis: "20241003", name: "Budi Pratama", kelas: "Teknik Informatika - B", submitTime: "14:40, 10 Okt 2026", nilai: 65, status: "Remedial" },
  { id: 4, nis: "20241004", name: "Dewi Lestari", kelas: "Teknik Informatika - B", submitTime: "14:40, 10 Okt 2026", nilai: 85, status: "Lulus" },
];

export function RecentEvaluationTable({ role, students, onExportCSV, title, subtitle }) {
  const [tableStatusFilter, setTableStatusFilter] = useState("all");

  const rawList = Array.isArray(students) ? students : defaultEvaluationData;

  // If role is student (murid), show only their own score/evaluation
  const displayedList = role === "murid"
    ? rawList.filter((s) => s.nis === "20241001" || s.name?.includes("Ahmad") || s.id === 1)
    : rawList;

  const filteredStudents = displayedList.filter((s) => {
    if (tableStatusFilter === "all") return true;
    return (s.status || "").toLowerCase() === tableStatusFilter.toLowerCase();
  });

  const displaySubtitle = subtitle || rawList[0]?.quiz_title || "Evaluasi Hasil Belajar Peserta Didik";

  return (
    <Card className="bg-white border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4 w-full">
      <CardHeader className="p-0 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 space-y-0">
        <div>
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base font-bold text-slate-900">
              {title || (role === "admin"
                ? "Monitoring Guru Pengampu & Kelas"
                : role === "guru"
                ? "Rekapitulasi Nilai Ujian Siswa"
                : "Daftar Evaluasi & Ujian Saya")}
            </CardTitle>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            {displaySubtitle}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 bg-slate-100 text-xs text-slate-600 font-medium border-none">
            <Calendar className="h-3.5 w-3.5 text-brand-600" />
            <span>10 Oktober 2026</span>
          </Badge>

          <div className="w-36">
            <CustomSelect
              value={tableStatusFilter}
              onChange={(val) => setTableStatusFilter(val)}
              options={[
                { value: "all", label: "Semua Status" },
                { value: "lulus", label: "Lulus Saja" },
                { value: "remedial", label: "Remedial Saja" },
              ]}
              placeholder="Filter Status"
              className="py-1.5 rounded-full bg-slate-100 border-none hover:bg-slate-200/60"
            />
          </div>

          {role === "guru" && (
            <Button
              size="sm"
              onClick={onExportCSV}
              className="rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs px-3.5 py-1.5 shadow-xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Ekspor .CSV
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="border-b border-slate-100">
            <TableRow>
              <TableHead className="py-3 px-4">Nama & Identitas</TableHead>
              <TableHead className="py-3 px-4">Kelas / Rombel</TableHead>
              <TableHead className="py-3 px-4">Waktu Submit</TableHead>
              <TableHead className="py-3 px-4 text-center">Nilai Skor</TableHead>
              <TableHead className="py-3 px-4 text-center">Status</TableHead>
              <TableHead className="py-3 px-4 text-right">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  Belum ada riwayat hasil pengerjaan kuis dari siswa rombel ajar ini.
                </TableCell>
              </TableRow>
            ) :
              filteredStudents.map((student) => (
              <TableRow key={student.id} className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-blue-50 text-brand-700 font-bold text-xs">
                        {student.name ? student.name.charAt(0) : "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        NIS: {student.nis || student.nomor_induk || student.nim_nip}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3.5 px-4 font-medium text-slate-600">
                  {student.kelas || "Teknik Informatika - A"}
                </TableCell>
                <TableCell className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                  {student.submitTime || "13:30, 10 Okt 2026"}
                </TableCell>
                <TableCell className="py-3.5 px-4 text-center">
                  <span className="font-extrabold text-sm text-slate-900">{student.nilai ?? 100}</span>
                  <span className="text-slate-400 text-xs"> / 100</span>
                </TableCell>
                <TableCell className="py-3.5 px-4 text-center">
                  <Badge
                    variant={student.status === "Lulus" ? "success" : "warning"}
                    className="gap-1 text-[11px] font-bold px-2.5 py-0.5"
                  >
                    {student.status === "Lulus" ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {student.status || "Lulus"}
                  </Badge>
                </TableCell>
                <TableCell className="py-3.5 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info(`Melihat detail hasil ujian ${student.name} (${student.nilai ?? 100}/100)`)}
                    className="px-3 py-1 rounded-xl text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-blue-50 cursor-pointer"
                  >
                    Lihat Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
