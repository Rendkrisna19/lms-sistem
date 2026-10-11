import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, BookMarked, UserCheck, Calendar, Clock, MapPin, Layers } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CustomSelect } from "../ui/custom-select";
import { api } from "../../lib/api";
import { toast } from "sonner";

export function ClassAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  classroom = null,
  courses = [],
  teachers = [],
}) {
  const [localCourses, setLocalCourses] = useState(courses);
  const [localTeachers, setLocalTeachers] = useState(teachers);
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [scheduleDay, setScheduleDay] = useState("Senin");
  const [scheduleTime, setScheduleTime] = useState("08:00 - 10:00");
  const [room, setRoom] = useState("Ruang Kelas Teori");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (courses && courses.length > 0) {
      setLocalCourses(courses);
    }
  }, [courses]);

  useEffect(() => {
    if (teachers && teachers.length > 0) {
      setLocalTeachers(teachers);
    }
  }, [teachers]);

  useEffect(() => {
    if (isOpen) {
      if (!courses || courses.length === 0) {
        api.get("/admin/courses").then((res) => {
          if (res.data?.status === "success" && res.data.data) {
            setLocalCourses(res.data.data);
            if (res.data.data.length > 0) setCourseId(res.data.data[0].id);
          }
        }).catch(() => {});
      } else if (!courseId && courses.length > 0) {
        setCourseId(courses[0].id);
      }

      if (!teachers || teachers.length === 0) {
        api.get("/admin/teachers").then((res) => {
          if (res.data?.status === "success" && res.data.data) {
            setLocalTeachers(res.data.data);
            if (res.data.data.length > 0) setTeacherId(res.data.data[0].id);
          }
        }).catch(() => {});
      } else if (!teacherId && teachers.length > 0) {
        setTeacherId(teachers[0].id);
      }

      setScheduleDay("Senin");
      setScheduleTime("08:00 - 10:00");
      setRoom("Lab Komputer 1");
    }
  }, [isOpen, courses, teachers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classroom?.id) {
      toast.error("Data kelas belum siap.");
      return;
    }
    if (!courseId || !teacherId) {
      toast.error("Mata Pelajaran dan Guru Pengampu wajib dipilih.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        course_id: courseId,
        teacher_id: teacherId,
        schedule_day: scheduleDay,
        schedule_time: scheduleTime.trim() || "08:00 - 10:00",
        room: room.trim() || "Ruang Kelas",
      };

      const res = await api.post(`/admin/classrooms/${classroom.id}/assignments`, payload);
      if (res.data?.status === "success") {
        toast.success(`Plotting Mapel & Guru berhasil ditugaskan ke kelas ${classroom.name || ""}!`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(", ")
          : "Gagal menambahkan penugasan mapel.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayOptions = [
    { value: "Senin", label: "Senin" },
    { value: "Selasa", label: "Selasa" },
    { value: "Rabu", label: "Rabu" },
    { value: "Kamis", label: "Kamis" },
    { value: "Jumat", label: "Jumat" },
    { value: "Sabtu", label: "Sabtu" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-visible animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Plotting Mapel & Guru Pengampu
              </h3>
              <p className="text-xs text-slate-400">
                Tugaskan Guru dan Jadwal Mapel untuk Kelas: <span className="font-bold text-blue-600">{classroom?.name || ""}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 rounded-full p-1 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative z-30">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Pilih Mata Pelajaran
            </label>
            <CustomSelect
              value={courseId}
              onChange={(val) => setCourseId(val)}
              options={localCourses.map((c) => ({
                value: c.id,
                label: c.title,
                description: c.description ? c.description.slice(0, 50) + "..." : "Kurikulum aktif",
              }))}
              placeholder="Pilih Mata Pelajaran..."
              icon={BookMarked}
            />
          </div>

          <div className="relative z-20">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Pilih Guru Pengampu di Kelas Ini
            </label>
            <CustomSelect
              value={teacherId}
              onChange={(val) => setTeacherId(val)}
              options={localTeachers.map((t) => ({
                value: t.id,
                label: t.name,
                description: `NIP: ${t.nomor_induk || t.nim_nip || "-"}`,
              }))}
              placeholder="Pilih Guru Pengampu..."
              icon={UserCheck}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Hari Jadwal Belajar
              </label>
              <CustomSelect
                value={scheduleDay}
                onChange={(val) => setScheduleDay(val)}
                options={dayOptions}
                placeholder="Pilih Hari..."
                icon={Calendar}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Waktu / Jam Belajar
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="08:00 - 10:00"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="pl-10 text-xs rounded-xl font-mono"
                />
              </div>
            </div>
          </div>

          <div className="relative z-0">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Ruangan Kelas / Lab
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Contoh: Lab Komputer 1 / Ruang Teori 302"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="pl-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Action Buttons (Strictly Pure Blue!) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 shadow-xs"
            >
              {isSubmitting ? "Menugaskan..." : "Tugaskan ke Kelas"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
