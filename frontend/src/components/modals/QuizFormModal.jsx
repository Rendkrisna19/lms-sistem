import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Award,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  UploadCloud,
  ImageIcon,
  Bold,
  Italic,
  List,
  Code,
  Sparkles,
  Check,
  FileQuestion,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { api } from "../../lib/api";

export function QuizFormModal({
  isOpen,
  onClose,
  onSuccess,
  assignedOptions = [],
  quizToEdit = null,
  currentUser,
}) {
  const isEditMode = !!quizToEdit;

  // General Quiz Settings
  const [selectedAssignmentIndex, setSelectedAssignmentIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingScore, setPassingScore] = useState(75);
  const [hasScheduling, setHasScheduling] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Questions State
  const defaultOptionSet = [
    { option_label: "A", option_text: "", image_url: "", is_correct: true },
    { option_label: "B", option_text: "", image_url: "", is_correct: false },
    { option_label: "C", option_text: "", image_url: "", is_correct: false },
    { option_label: "D", option_text: "", image_url: "", is_correct: false },
  ];

  const defaultQuestion = {
    question_text: "",
    image_url: "",
    points: 25,
    explanation: "",
    options: [...defaultOptionSet],
  };

  const [questions, setQuestions] = useState([{ ...defaultQuestion }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

  // Populate form on open or when quizToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (quizToEdit) {
        setTitle(quizToEdit.title || "");
        setInstructions(quizToEdit.instructions || "");
        setDurationMinutes(quizToEdit.duration_minutes || 60);
        setPassingScore(quizToEdit.passing_score || 75);
        setHasScheduling(!!(quizToEdit.starts_at || quizToEdit.ends_at));
        setStartsAt(quizToEdit.starts_at ? quizToEdit.starts_at.slice(0, 16) : "");
        setEndsAt(quizToEdit.ends_at ? quizToEdit.ends_at.slice(0, 16) : "");
        setIsActive(quizToEdit.is_active ?? true);

        // Find assignment index
        const idx = assignedOptions.findIndex(
          (opt) => String(opt.classroom_id) === String(quizToEdit.classroom_id) && String(opt.course_id) === String(quizToEdit.course_id)
        );
        setSelectedAssignmentIndex(idx !== -1 ? idx : 0);

        // Populate questions
        if (quizToEdit.questions && quizToEdit.questions.length > 0) {
          setQuestions(
            quizToEdit.questions.map((q) => ({
              id: q.id,
              question_text: q.question_text || "",
              image_url: q.image_url || "",
              points: q.points || 10,
              explanation: q.explanation || "",
              options: q.options?.map((opt) => ({
                id: opt.id,
                option_label: opt.option_label,
                option_text: opt.option_text || "",
                image_url: opt.image_url || "",
                is_correct: !!opt.is_correct,
              })) || [...defaultOptionSet],
            }))
          );
        } else {
          setQuestions([{ ...defaultQuestion }]);
        }
      } else {
        // Reset for new creation
        setTitle("");
        setInstructions("");
        setDurationMinutes(60);
        setPassingScore(75);
        setHasScheduling(false);
        setStartsAt("");
        setEndsAt("");
        setIsActive(true);
        setSelectedAssignmentIndex(0);
        setQuestions([{ ...defaultQuestion }]);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, quizToEdit]);

  if (!isOpen) return null;

  const currentAssignment = assignedOptions[selectedAssignmentIndex] || assignedOptions[0] || null;

  // Add question
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question_text: "",
        image_url: "",
        points: 25,
        explanation: "",
        options: [
          { option_label: "A", option_text: "", image_url: "", is_correct: true },
          { option_label: "B", option_text: "", image_url: "", is_correct: false },
          { option_label: "C", option_text: "", image_url: "", is_correct: false },
          { option_label: "D", option_text: "", image_url: "", is_correct: false },
        ],
      },
    ]);
  };

  // Remove question
  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      toast.error("Ujian harus memiliki minimal 1 butir soal.");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Update question field
  const handleQuestionChange = (qIndex, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIndex ? { ...q, [field]: value } : q))
    );
  };

  // Update option field
  const handleOptionChange = (qIndex, optIndex, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = q.options.map((opt, oi) => {
          if (field === "is_correct") {
            // Radio behavior: only one correct answer
            return { ...opt, is_correct: oi === optIndex };
          }
          if (oi === optIndex) {
            return { ...opt, [field]: value };
          }
          return opt;
        });
        return { ...q, options: newOptions };
      })
    );
  };

  // Rich text formatting helper
  const handleApplyFormatting = (qIndex, tag) => {
    const q = questions[qIndex];
    let insertion = "";
    if (tag === "b") insertion = "<strong>Teks Tebal</strong>";
    if (tag === "i") insertion = "<em>Teks Miring</em>";
    if (tag === "code") insertion = "<code>SELECT * FROM tabel;</code>";
    if (tag === "ul") insertion = "<ul><li>Poin 1</li><li>Poin 2</li></ul>";

    handleQuestionChange(qIndex, "question_text", (q.question_text || "") + " " + insertion);
  };

  // Upload image to server
  const handleImageUpload = async (file, target, qIndex, optIndex = null) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran berkas gambar maksimal 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploadingImageIndex(`${qIndex}-${optIndex ?? "q"}`);
      const res = await api.post("/teacher/quizzes/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.status === "success") {
        const url = res.data.url;
        if (target === "question") {
          handleQuestionChange(qIndex, "image_url", url);
        } else if (target === "option" && optIndex !== null) {
          handleOptionChange(qIndex, optIndex, "image_url", url);
        }
        toast.success("Gambar berhasil diunggah.");
      }
    } catch (err) {
      toast.error("Gagal mengunggah gambar ke server.");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentAssignment) {
      toast.error("Silakan tentukan rombongan belajar kelas dan mata pelajaran.");
      return;
    }

    if (!title.trim()) {
      toast.error("Judul ujian wajib diisi.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Teks soal pada nomor ${i + 1} belum diisi.`);
        return;
      }
      const hasCorrect = q.options.some((opt) => opt.is_correct);
      if (!hasCorrect) {
        toast.error(`Kunci jawaban benar pada nomor ${i + 1} belum dipilih.`);
        return;
      }
      const hasEmptyOption = q.options.some((opt) => !opt.option_text.trim() && !opt.image_url);
      if (hasEmptyOption) {
        toast.error(`Semua pilihan jawaban pada nomor ${i + 1} harus memiliki teks atau gambar.`);
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      classroom_id: currentAssignment.classroom_id,
      course_id: currentAssignment.course_id,
      teacher_id: currentUser?.id,
      title: title.trim(),
      instructions: instructions.trim(),
      duration_minutes: parseInt(durationMinutes, 10),
      passing_score: parseInt(passingScore, 10),
      starts_at: hasScheduling && startsAt ? startsAt : null,
      ends_at: hasScheduling && endsAt ? endsAt : null,
      is_active: isActive,
      questions: questions,
    };

    try {
      let res;
      if (isEditMode) {
        res = await api.put(`/teacher/quizzes/${quizToEdit.id}`, payload);
      } else {
        res = await api.post("/teacher/quizzes", payload);
      }

      if (res.data?.status === "success") {
        toast.success(res.data.message || (isEditMode ? "Ujian berhasil diperbarui." : "Ujian berhasil dibuat."));
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Gagal menyimpan data ujian.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + (parseInt(q.points, 10) || 0), 0);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 my-6 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 rounded-full p-1.5 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 shrink-0">
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditMode ? "Edit Ujian & Kuis Online" : "Buat Ujian & Kuis Baru"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur penjadwalan buka-tutup, durasi, KKM, dan butir soal bergambar sesuai plotting rombel kelas Anda.
            </p>
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-6 pr-1">
          {/* Section 1: Plotting Kelas & Mapel */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Target Kelas & Mata Pelajaran (Floating Mapel) <span className="text-red-500">*</span>
            </label>
            {assignedOptions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assignedOptions.map((opt, idx) => (
                  <button
                    key={`${opt.classroom_id}-${opt.course_id}-${idx}`}
                    type="button"
                    onClick={() => setSelectedAssignmentIndex(idx)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      selectedAssignmentIndex === idx
                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">
                        {opt.classroom_name} ({opt.classroom_code})
                      </span>
                      {selectedAssignmentIndex === idx && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 font-medium truncate">
                      {opt.course_title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs">
                Belum ada plotting kelas & mapel aktif yang ditugaskan ke akun Anda.
              </div>
            )}
          </div>

          {/* Section 2: Informasi Ujian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Judul Ujian / Kuis <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kuis Evaluasi 01: Normalisasi & Relasi Basis Data"
                className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Durasi Pengerjaan (Menit) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="360"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Nilai Minimum Kelulusan (KKM) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                required
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Petunjuk & Instruksi Pengerjaan
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Tuliskan tata tertib pengerjaan, petunjuk khusus, dll..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Section 3: Penjadwalan Buka & Tutup */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Penjadwalan Waktu Ujian (Buka & Tutup)
                </span>
                <span className="text-[11px] text-slate-500">
                  Batasi waktu kuis dapat diakses oleh siswa.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasScheduling}
                  onChange={(e) => setHasScheduling(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {hasScheduling && (
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Jadwal Ujian Dibuka (Mulai)
                  </label>
                  <Input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="h-9 rounded-xl border-slate-200 text-xs w-full"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Jadwal Ujian Ditutup (Selesai)
                  </label>
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="h-9 rounded-xl border-slate-200 text-xs w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Status Aktif / Nonaktif */}
          <div className="flex items-center justify-between px-2">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Status Pelaksanaan Ujian
              </span>
              <span className="text-[11px] text-slate-500">
                {isActive ? "Ujian aktif dan siap dikerjakan siswa" : "Ujian disimpan sebagai draf nonaktif"}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Section 5: Penyusun Butir Soal (Question Builder) */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileQuestion className="h-4 w-4 text-blue-600" />
                  <span>Penyusun Butir Soal & Kunci Jawaban</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Total: <strong className="text-slate-700">{questions.length} Butir Soal</strong> • Bobot Total: <strong className="text-blue-600">{totalPoints} Poin</strong>
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddQuestion}
                className="rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs cursor-pointer gap-1.5 h-8 font-bold"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Soal Baru
              </Button>
            </div>

            {/* Questions List */}
            {questions.map((question, qIndex) => (
              <div
                key={qIndex}
                className="p-5 rounded-3xl border border-slate-200 bg-slate-50/50 space-y-4 relative group hover:border-blue-200 transition-colors"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Butir Soal Nomor {qIndex + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[11px] text-slate-400 font-semibold">Bobot:</span>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={question.points}
                        onChange={(e) => handleQuestionChange(qIndex, "points", parseInt(e.target.value, 10) || 10)}
                        className="h-7 w-16 text-center text-xs rounded-lg border-slate-200 font-bold"
                      />
                      <span className="text-[11px] text-slate-400">Poin</span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Question Text with Rich Text Toolbar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">
                      Teks Soal <span className="text-red-500">*</span>
                    </label>
                    {/* Rich text quick insertion buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleApplyFormatting(qIndex, "b")}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        title="Tebalkan Teks"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyFormatting(qIndex, "i")}
                        className="px-2 py-0.5 rounded text-[10px] italic bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        title="Miringkan Teks"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyFormatting(qIndex, "code")}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        title="Kode / Rumus"
                      >
                        Code
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={question.question_text}
                    onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                    placeholder="Tuliskan pertanyaan soal di sini... (Mendukung HTML & cetak tebal)"
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* Question Image Attachment */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                      <span>Sisipkan Gambar pada Soal (Opsional)</span>
                    </span>
                    {question.image_url && (
                      <button
                        type="button"
                        onClick={() => handleQuestionChange(qIndex, "image_url", "")}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], "question", qIndex)}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    <Input
                      type="url"
                      value={question.image_url}
                      onChange={(e) => handleQuestionChange(qIndex, "image_url", e.target.value)}
                      placeholder="Atau tempel URL gambar langsung..."
                      className="h-8 rounded-xl border-slate-200 text-xs flex-1 font-mono"
                    />
                  </div>

                  {question.image_url && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 max-w-xs mt-2">
                      <img
                        src={question.image_url}
                        alt="Preview Soal"
                        className="w-full h-auto max-h-36 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Options List with Image Option capability & Correct Key selector */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase block">
                    Pilihan Jawaban & Kunci Jawaban Benar <span className="text-red-500">*</span>
                  </label>

                  <div className="space-y-2">
                    {question.options.map((opt, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-2xl border transition-all ${
                          opt.is_correct
                            ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400/20"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Radio Button for Correct Key */}
                          <button
                            type="button"
                            onClick={() => handleOptionChange(qIndex, optIndex, "is_correct", true)}
                            className={`h-7 w-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                              opt.is_correct
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300"
                            }`}
                            title="Klik untuk memilih sebagai kunci jawaban"
                          >
                            {opt.option_label}
                          </button>

                          {/* Option Text Input */}
                          <Input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) => handleOptionChange(qIndex, optIndex, "option_text", e.target.value)}
                            placeholder={`Teks pilihan ${opt.option_label}...`}
                            className="h-9 rounded-xl border-slate-200 text-xs flex-1 bg-white"
                          />

                          {/* Image Option Upload button */}
                          <label className="shrink-0 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-500">
                            <ImageIcon className="h-4 w-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e.target.files[0], "option", qIndex, optIndex)}
                              className="hidden"
                            />
                          </label>

                          {opt.is_correct && (
                            <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 font-bold shrink-0">
                              Kunci Benar
                            </Badge>
                          )}
                        </div>

                        {/* Option Image Preview if attached */}
                        {opt.image_url && (
                          <div className="mt-2 pl-9 flex items-center gap-2">
                            <img
                              src={opt.image_url}
                              alt={`Gambar Opsi ${opt.option_label}`}
                              className="h-14 w-auto rounded-lg border border-slate-200 object-contain bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleOptionChange(qIndex, optIndex, "image_url", "")}
                              className="text-[10px] text-red-500 hover:underline cursor-pointer"
                            >
                              Hapus Gambar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Pembahasan / Keterangan Jawaban (Opsional)
                  </label>
                  <Input
                    type="text"
                    value={question.explanation}
                    onChange={(e) => handleQuestionChange(qIndex, "explanation", e.target.value)}
                    placeholder="Jelaskan alasan kunci jawaban benar di sini..."
                    className="h-8 rounded-xl border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl text-xs px-4 cursor-pointer"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 shadow-sm cursor-pointer gap-2 font-bold"
            >
              <Award className="h-4 w-4" />
              {isSubmitting
                ? "Menyimpan Ujian..."
                : isEditMode
                ? "Perbarui Ujian & Kuis"
                : "Simpan & Jadwalkan Ujian"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
