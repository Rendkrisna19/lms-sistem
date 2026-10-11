import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileQuestion, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { quizApi } from "../../features/quiz/api";
import { useQuizEditor } from "../../features/quiz/useQuizEditor";
import { useImageUpload } from "../../features/quiz/useImageUpload";
import { createInitialState, createUid, fromServer, questionStatus } from "../../features/quiz/editorModel";
import { getErrorMessage, getValidationErrors, isCanceled } from "../../lib/api";
import { htmlToPlainText, isHtmlBlank } from "../../lib/sanitize";
import { Button, buttonVariants } from "../../components/ui/button";
import { Alert } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { EditorSection } from "../../components/quiz/editor/EditorSection";
import { QuizDetailsCard } from "../../components/quiz/editor/QuizDetailsCard";
import { QuizSettingsCard } from "../../components/quiz/editor/QuizSettingsCard";
import { QuestionCard } from "../../components/quiz/editor/QuestionCard";
import { QuestionNavigator } from "../../components/quiz/editor/QuestionNavigator";
import { ValidationSummary } from "../../components/quiz/editor/ValidationSummary";
import { EditorSkeleton } from "../../components/quiz/editor/EditorSkeleton";

const FIELD_ANCHORS = {
  assignment: "field-assignment",
  title: "field-title",
  duration_minutes: "field-duration",
  passing_score: "field-passing",
  starts_at: "field-starts",
  ends_at: "field-ends",
  questions: "section-questions",
};

function hasContent(question) {
  return !isHtmlBlank(question.question_text) || question.options.some((o) => !isHtmlBlank(o.option_text) || o.image_url);
}

export function QuizEditorPage() {
  const { quizId } = useParams();
  const isEdit = Boolean(quizId);
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState({ isLoading: true, error: null });
  const [assignedOptions, setAssignedOptions] = useState([]);
  const [quizMeta, setQuizMeta] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(() => new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const allowNavigation = useRef(false);

  const editor = useQuizEditor(createInitialState());
  const { state, actions, errors, payload, isDirty, load, markSaved, validate, applyServerErrors } = editor;
  const { upload } = useImageUpload();

  // ---- Muat plotting kelas & (mode edit) data ujian ----
  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };
    setLoadState({ isLoading: true, error: null });

    Promise.all([quizApi.options(config), isEdit ? quizApi.detail(quizId, config) : Promise.resolve(null)])
      .then(([options, quiz]) => {
        setAssignedOptions(options.assigned_options);
        const initial = quiz ? fromServer(quiz) : createInitialState(options.assigned_options);
        load(initial);
        setQuizMeta(quiz);
        setExpanded(new Set(initial.questions.slice(0, 1).map((q) => q.uid)));
        setLoadState({ isLoading: false, error: null });
      })
      .catch((error) => {
        if (isCanceled(error)) return;
        const notFound = error.response?.status === 404;
        setLoadState({ isLoading: false, error: notFound ? "Ujian tidak ditemukan atau bukan milik Anda." : getErrorMessage(error, "Gagal memuat data ujian.") });
      });

    return () => controller.abort();
  }, [isEdit, quizId, load, reloadKey]);

  // ---- Peringatan meninggalkan halaman dengan perubahan belum disimpan ----
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && !allowNavigation.current && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // ---- Status & navigasi soal ----
  const statuses = useMemo(
    () => Object.fromEntries(state.questions.map((question) => [question.uid, questionStatus(question, errors)])),
    [state.questions, errors]
  );
  const totalPoints = useMemo(() => state.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0), [state.questions]);

  const scrollToElement = (id) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      const focusable = element.matches("input, textarea, button, [contenteditable]")
        ? element
        : element.querySelector("input:not([type=hidden]):not(.sr-only), [contenteditable=true], textarea");
      focusable?.focus({ preventScroll: true });
    });
  };

  const expand = useCallback((uid) => setExpanded((prev) => new Set(prev).add(uid)), []);

  const toggleExpand = useCallback((uid) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }, []);

  const jumpToQuestion = useCallback((uid) => {
    expand(uid);
    scrollToElement(`question-${uid}`);
  }, [expand]);

  const jumpToError = (key) => {
    if (FIELD_ANCHORS[key]) return scrollToElement(FIELD_ANCHORS[key]);
    const [kind, uid] = key.split(":");
    if (kind === "q") return jumpToQuestion(uid);
    if (kind === "o") {
      const question = state.questions.find((q) => q.options.some((o) => o.uid === uid));
      if (question) {
        expand(question.uid);
        scrollToElement(`option-${uid}`);
      }
    }
  };

  const addQuestion = useCallback((afterUid) => {
    const uid = createUid();
    actions.addQuestion(afterUid, uid);
    expand(uid);
    scrollToElement(`question-${uid}`);
  }, [actions, expand]);

  const duplicateQuestion = useCallback((uid) => {
    const newUid = createUid();
    actions.duplicateQuestion(uid, newUid);
    expand(newUid);
    scrollToElement(`question-${newUid}`);
    toast.success("Soal berhasil diduplikat.");
  }, [actions, expand]);

  const requestRemove = useCallback((question, number) => {
    if (hasContent(question)) setRemoveTarget({ question, number });
    else actions.removeQuestion(question.uid);
  }, [actions]);

  // ---- Simpan ----
  const save = async () => {
    if (isSaving) return;
    const clientErrors = validate();
    const errorKeys = Object.keys(clientErrors);
    if (errorKeys.length) {
      setShowSummary(true);
      toast.error(`Masih ada ${errorKeys.length} isian yang perlu diperbaiki.`);
      jumpToError(errorKeys[0]);
      return;
    }

    setIsSaving(true);
    try {
      const res = isEdit ? await quizApi.update(quizId, payload) : await quizApi.create(payload);
      markSaved();
      allowNavigation.current = true;
      toast.success(res.message || "Ujian berhasil disimpan.");
      navigate(`/ujian/${res.data.id}`, { replace: !isEdit });
    } catch (error) {
      const serverErrors = getValidationErrors(error);
      if (Object.keys(serverErrors).length) {
        applyServerErrors(serverErrors);
        setShowSummary(true);
        toast.error("Server menolak beberapa isian. Periksa ringkasan kesalahan.");
      } else {
        toast.error(getErrorMessage(error, "Gagal menyimpan ujian."));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Ctrl/Cmd + S untuk menyimpan
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ---- Render ----
  if (loadState.isLoading) return <EditorSkeleton />;

  if (loadState.error) {
    return (
      <div className="max-w-2xl space-y-4">
        <Link to="/ujian" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke daftar ujian
        </Link>
        <Alert variant="danger" title="Editor tidak dapat dibuka" action={<Button size="sm" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>Coba lagi</Button>}>
          {loadState.error}
        </Alert>
      </div>
    );
  }

  if (assignedOptions.length === 0) {
    return (
      <div className="max-w-2xl space-y-4">
        <Link to="/ujian" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Kembali ke daftar ujian
        </Link>
        <Alert variant="warning" title="Belum ada plotting kelas & mata pelajaran">
          Ujian hanya dapat dibuat untuk kelas yang ditugaskan kepada Anda. Hubungi admin sekolah untuk menambahkan plotting mengajar.
        </Alert>
      </div>
    );
  }

  const finishedAttempts = quizMeta?.finished_attempts_count ?? 0;

  return (
    <div className="space-y-6">
      {/* Bilah aksi (menempel di atas saat menggulir) */}
      <div className="sticky top-16 sm:top-20 z-20 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-6 lg:px-8 py-3 bg-canvas/90 backdrop-blur-md border-b border-slate-200/70">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/ujian" className={buttonVariants({ variant: "outline", size: "icon" })} aria-label="Kembali ke daftar ujian">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{isEdit ? "Edit ujian" : "Ujian baru"}</p>
              <h1 className="text-lg font-bold text-slate-900 truncate">{state.title.trim() || (isEdit ? "Ujian tanpa judul" : "Buat Ujian & Kuis Baru")}</h1>
            </div>
            <Badge variant={state.is_active ? "success" : "muted"} className="hidden sm:inline-flex shrink-0">
              {state.is_active ? "Aktif" : "Draf"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline text-xs text-slate-500 mr-1" aria-live="polite">
              {isDirty ? "Perubahan belum disimpan" : "Semua perubahan tersimpan"}
            </span>
            <Button variant="outline" onClick={() => navigate("/ujian")}>
              Batal
            </Button>
            <Button onClick={save} isLoading={isSaving} title="Simpan (Ctrl+S)">
              {!isSaving && <Save className="h-4 w-4" aria-hidden="true" />}
              {isEdit ? "Simpan Perubahan" : "Simpan Ujian"}
            </Button>
          </div>
        </div>
      </div>

      {finishedAttempts > 0 && (
        <Alert variant="warning" title={`Ujian ini sudah dikerjakan ${finishedAttempts} siswa`}>
          Perubahan kunci jawaban atau bobot tidak mengubah nilai yang sudah tersimpan. Menghapus soal juga menghapus jawaban siswa pada soal tersebut.
        </Alert>
      )}

      {showSummary && <ValidationSummary errors={errors} onJump={jumpToError} onDismiss={() => setShowSummary(false)} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-6 min-w-0">
          <QuizDetailsCard state={state} setField={actions.setField} errors={errors} assignedOptions={assignedOptions} />

          <EditorSection
            id="section-questions"
            icon={FileQuestion}
            title="Butir Soal & Kunci Jawaban"
            description={`${state.questions.length} soal • ${totalPoints} poin total. Nilai akhir siswa dihitung otomatis ke skala 0–100.`}
            actions={
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(new Set(state.questions.map((q) => q.uid)))}>
                  Buka semua
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(new Set())}>
                  Ciutkan semua
                </Button>
              </div>
            }
            bodyClassName="space-y-3"
          >
            {errors.questions && <Alert variant="danger">{errors.questions}</Alert>}

            {state.questions.map((question, index) => (
              <QuestionCard
                key={question.uid}
                question={question}
                index={index}
                total={state.questions.length}
                errors={errors}
                status={statuses[question.uid]}
                isExpanded={expanded.has(question.uid)}
                onToggleExpand={toggleExpand}
                actions={actions}
                onRequestRemove={requestRemove}
                onDuplicate={duplicateQuestion}
                onUploadImage={upload}
              />
            ))}

            <button
              type="button"
              onClick={() => addQuestion()}
              className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-5 text-sm font-semibold text-slate-500 hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Tambah soal baru
            </button>
          </EditorSection>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-40" aria-label="Pengaturan & navigasi soal">
          <QuizSettingsCard state={state} setField={actions.setField} errors={errors} />
          <QuestionNavigator
            questions={state.questions}
            statuses={statuses}
            expandedUids={expanded}
            onJump={jumpToQuestion}
            onAdd={() => addQuestion()}
            totalPoints={totalPoints}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          actions.removeQuestion(removeTarget.question.uid);
          setRemoveTarget(null);
          toast.success(`Soal ${removeTarget.number} dihapus.`);
        }}
        title={`Hapus soal nomor ${removeTarget?.number}?`}
        description={removeTarget ? `"${htmlToPlainText(removeTarget.question.question_text, 90) || "Soal tanpa teks"}" beserta pilihan jawabannya akan dihapus.` : ""}
        confirmLabel="Hapus soal"
      />

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Tinggalkan halaman?"
        description="Perubahan pada ujian ini belum disimpan dan akan hilang."
        confirmLabel="Tinggalkan"
        cancelLabel="Tetap di sini"
      />
    </div>
  );
}
