import { fromDateTimeLocalValue, toDateTimeLocalValue } from "../../lib/datetime";
import { isHtmlBlank } from "../../lib/sanitize";

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;
export const DEFAULT_OPTION_COUNT = 4;
export const DEFAULT_POINTS = 10;

export const optionLabel = (index) => String.fromCharCode(65 + index);

export function createUid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `uid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createOption(overrides = {}) {
  return { uid: createUid(), id: null, option_text: "", image_url: "", is_correct: false, ...overrides };
}

export function createQuestion(overrides = {}) {
  return {
    uid: createUid(),
    id: null,
    question_text: "",
    image_url: "",
    points: DEFAULT_POINTS,
    explanation: "",
    options: Array.from({ length: DEFAULT_OPTION_COUNT }, () => createOption()),
    ...overrides,
  };
}

export const assignmentKey = (classroomId, courseId) => (classroomId && courseId ? `${classroomId}:${courseId}` : "");

export function createInitialState(assignedOptions = []) {
  const only = assignedOptions.length === 1 ? assignedOptions[0] : null;
  return {
    assignmentKey: only ? assignmentKey(only.classroom_id, only.course_id) : "",
    title: "",
    instructions: "",
    duration_minutes: 60,
    passing_score: 75,
    is_active: true,
    show_result_immediately: true,
    hasSchedule: false,
    starts_at: "",
    ends_at: "",
    questions: [createQuestion()],
  };
}

/** Data detail ujian dari API → state editor. */
export function fromServer(quiz) {
  return {
    assignmentKey: assignmentKey(quiz.classroom_id, quiz.course_id),
    title: quiz.title ?? "",
    instructions: quiz.instructions ?? "",
    duration_minutes: quiz.duration_minutes ?? 60,
    passing_score: quiz.passing_score ?? 75,
    is_active: !!quiz.is_active,
    show_result_immediately: quiz.show_result_immediately ?? true,
    hasSchedule: !!(quiz.starts_at || quiz.ends_at),
    starts_at: toDateTimeLocalValue(quiz.starts_at),
    ends_at: toDateTimeLocalValue(quiz.ends_at),
    questions: (quiz.questions ?? []).map((question) => ({
      uid: createUid(),
      id: question.id,
      question_text: question.question_text ?? "",
      image_url: question.image_url ?? "",
      points: question.points ?? DEFAULT_POINTS,
      explanation: question.explanation ?? "",
      options: (question.options ?? []).map((option) => ({
        uid: createUid(),
        id: option.id,
        option_text: option.option_text ?? "",
        image_url: option.image_url ?? "",
        is_correct: !!option.is_correct,
      })),
    })),
  };
}

/** State editor → payload API (POST/PUT /teacher/quizzes). */
export function toPayload(state) {
  const [classroomId, courseId] = (state.assignmentKey || ":").split(":");
  return {
    classroom_id: Number(classroomId) || null,
    course_id: Number(courseId) || null,
    title: state.title.trim(),
    instructions: state.instructions.trim() || null,
    duration_minutes: Number(state.duration_minutes),
    passing_score: Number(state.passing_score),
    starts_at: state.hasSchedule ? fromDateTimeLocalValue(state.starts_at) : null,
    ends_at: state.hasSchedule ? fromDateTimeLocalValue(state.ends_at) : null,
    is_active: !!state.is_active,
    show_result_immediately: !!state.show_result_immediately,
    questions: state.questions.map((question) => ({
      ...(question.id ? { id: question.id } : {}),
      question_text: question.question_text,
      image_url: question.image_url || null,
      points: Number(question.points),
      explanation: isHtmlBlank(question.explanation) ? null : question.explanation,
      options: question.options.map((option) => ({
        ...(option.id ? { id: option.id } : {}),
        option_text: isHtmlBlank(option.option_text) ? "" : option.option_text,
        image_url: option.image_url || null,
        is_correct: !!option.is_correct,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Validasi (cermin dari aturan server di SaveQuizRequest)
// Kunci error: "title", "q:<uid>:question_text", "o:<uid>:option_text", dst.
// ---------------------------------------------------------------------------

export const questionKey = (uid, field) => `q:${uid}:${field}`;
export const optionKey = (uid, field) => `o:${uid}:${field}`;

const isInteger = (value) => value !== "" && value !== null && Number.isInteger(Number(value));

export function validateQuiz(state) {
  const errors = {};

  if (!state.assignmentKey) errors.assignment = "Pilih kelas & mata pelajaran tujuan ujian.";
  if (!state.title.trim()) errors.title = "Judul ujian wajib diisi.";
  else if (state.title.trim().length > 255) errors.title = "Judul ujian maksimal 255 karakter.";

  if (!isInteger(state.duration_minutes) || Number(state.duration_minutes) < 1 || Number(state.duration_minutes) > 600) {
    errors.duration_minutes = "Durasi harus 1–600 menit.";
  }
  if (!isInteger(state.passing_score) || Number(state.passing_score) < 0 || Number(state.passing_score) > 100) {
    errors.passing_score = "KKM harus 0–100.";
  }

  if (state.hasSchedule) {
    if (!state.starts_at && !state.ends_at) {
      errors.starts_at = "Isi minimal salah satu jadwal, atau matikan penjadwalan.";
    } else if (state.starts_at && state.ends_at && new Date(state.ends_at) <= new Date(state.starts_at)) {
      errors.ends_at = "Jadwal ditutup harus setelah jadwal dibuka.";
    }
  }

  if (state.questions.length === 0) errors.questions = "Tambahkan minimal satu butir soal.";

  state.questions.forEach((question, index) => {
    const number = index + 1;
    if (isHtmlBlank(question.question_text)) {
      errors[questionKey(question.uid, "question_text")] = `Teks soal nomor ${number} belum diisi.`;
    }
    if (!isInteger(question.points) || Number(question.points) < 1 || Number(question.points) > 1000) {
      errors[questionKey(question.uid, "points")] = "Bobot 1–1000.";
    }
    const correctCount = question.options.filter((option) => option.is_correct).length;
    if (question.options.length < MIN_OPTIONS) {
      errors[questionKey(question.uid, "options")] = `Soal nomor ${number} minimal memiliki ${MIN_OPTIONS} pilihan.`;
    } else if (correctCount !== 1) {
      errors[questionKey(question.uid, "options")] = `Tentukan satu kunci jawaban untuk soal nomor ${number}.`;
    }
    question.options.forEach((option, optIndex) => {
      if (isHtmlBlank(option.option_text) && !option.image_url) {
        errors[optionKey(option.uid, "option_text")] = `Pilihan ${optionLabel(optIndex)} harus berisi teks atau gambar.`;
      }
    });
  });

  return errors;
}

/** Status per soal untuk navigator: "error" | "complete" | "draft". */
export function questionStatus(question, errors) {
  const hasError =
    Object.keys(errors).some((key) => key.startsWith(`q:${question.uid}:`)) ||
    question.options.some((option) => errors[optionKey(option.uid, "option_text")]);
  if (hasError) return "error";

  const complete =
    !isHtmlBlank(question.question_text) &&
    question.options.length >= MIN_OPTIONS &&
    question.options.filter((o) => o.is_correct).length === 1 &&
    question.options.every((o) => !isHtmlBlank(o.option_text) || o.image_url);
  return complete ? "complete" : "draft";
}

/**
 * Error validasi server (kunci berbasis indeks, mis. "questions.0.options.1.option_text")
 * → kunci berbasis uid milik editor.
 */
export function mapServerErrors(serverErrors, state) {
  const mapped = {};
  Object.entries(serverErrors).forEach(([key, message]) => {
    const optionMatch = key.match(/^questions\.(\d+)\.options\.(\d+)\.(\w+)$/);
    const questionMatch = key.match(/^questions\.(\d+)\.(\w+)$/);
    if (optionMatch) {
      const option = state.questions[Number(optionMatch[1])]?.options[Number(optionMatch[2])];
      if (option) mapped[optionKey(option.uid, "option_text")] = message;
    } else if (questionMatch) {
      const question = state.questions[Number(questionMatch[1])];
      if (question) mapped[questionKey(question.uid, questionMatch[2])] = message;
    } else if (key === "classroom_id" || key === "course_id") {
      mapped.assignment = message;
    } else {
      mapped[key] = message;
    }
  });
  return mapped;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function updateQuestion(state, uid, updater) {
  return { ...state, questions: state.questions.map((q) => (q.uid === uid ? updater(q) : q)) };
}

export function quizEditorReducer(state, action) {
  switch (action.type) {
    case "load":
      return action.state;
    case "set":
      return { ...state, [action.field]: action.value };
    case "add_question": {
      const question = createQuestion(action.overrides);
      const index = action.afterUid ? state.questions.findIndex((q) => q.uid === action.afterUid) + 1 : state.questions.length;
      const questions = [...state.questions];
      questions.splice(index, 0, question);
      return { ...state, questions };
    }
    case "update_question":
      return updateQuestion(state, action.uid, (q) => ({ ...q, ...action.patch }));
    case "remove_question":
      return { ...state, questions: state.questions.filter((q) => q.uid !== action.uid) };
    case "duplicate_question": {
      const index = state.questions.findIndex((q) => q.uid === action.uid);
      if (index === -1) return state;
      const source = state.questions[index];
      const copy = {
        ...source,
        uid: action.newUid ?? createUid(),
        id: null,
        options: source.options.map((o) => ({ ...o, uid: createUid(), id: null })),
      };
      const questions = [...state.questions];
      questions.splice(index + 1, 0, copy);
      return { ...state, questions };
    }
    case "move_question": {
      const index = state.questions.findIndex((q) => q.uid === action.uid);
      const target = index + action.direction;
      if (index === -1 || target < 0 || target >= state.questions.length) return state;
      const questions = [...state.questions];
      [questions[index], questions[target]] = [questions[target], questions[index]];
      return { ...state, questions };
    }
    case "add_option":
      return updateQuestion(state, action.questionUid, (q) =>
        q.options.length >= MAX_OPTIONS ? q : { ...q, options: [...q.options, createOption()] }
      );
    case "update_option":
      return updateQuestion(state, action.questionUid, (q) => ({
        ...q,
        options: q.options.map((o) => (o.uid === action.optionUid ? { ...o, ...action.patch } : o)),
      }));
    case "remove_option":
      return updateQuestion(state, action.questionUid, (q) =>
        q.options.length <= MIN_OPTIONS ? q : { ...q, options: q.options.filter((o) => o.uid !== action.optionUid) }
      );
    case "set_correct":
      return updateQuestion(state, action.questionUid, (q) => ({
        ...q,
        options: q.options.map((o) => ({ ...o, is_correct: o.uid === action.optionUid })),
      }));
    default:
      return state;
  }
}
