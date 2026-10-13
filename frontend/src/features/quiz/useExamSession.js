import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { quizApi } from "./api";
import { getErrorMessage } from "../../lib/api";

const storageKey = (attemptId, kind) => `exam:${attemptId}:${kind}`;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Penyimpanan penuh / mode privat: abaikan, jawaban tetap dikirim ke server
  }
}

/** Sisa detik berdasarkan jam server (offset dihitung saat sesi dimulai). */
export function computeRemainingSeconds(deadlineIso, clockOffsetMs, now = Date.now()) {
  if (!deadlineIso) return Infinity;
  return Math.max(0, Math.floor((new Date(deadlineIso).getTime() - (now + clockOffsetMs)) / 1000));
}

/**
 * Mesin sesi ujian siswa:
 * - timer mengikuti jam server (tidak bisa diakali dengan mengubah jam perangkat),
 * - auto-save per jawaban dengan antrean & retry, jawaban tertunda disimpan di perangkat,
 * - peringatan sisa waktu & pengumpulan otomatis saat waktu habis.
 */
export function useExamSession(session, { onFinished }) {
  const attemptId = session.attempt.id;
  const deadline = session.attempt.deadline_at;
  const clockOffset = useMemo(() => new Date(session.server_time).getTime() - Date.now(), [session.server_time]);

  const [answers, setAnswers] = useState(() => {
    const pending = readJson(storageKey(attemptId, "pending"), {});
    return { ...session.answers, ...pending };
  });
  const [flags, setFlags] = useState(() => readJson(storageKey(attemptId, "flags"), {}));
  const [remaining, setRemaining] = useState(() => computeRemainingSeconds(deadline, clockOffset));
  const [saveState, setSaveState] = useState({ status: "idle", savedAt: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingRef = useRef(readJson(storageKey(attemptId, "pending"), {}));
  const flushingRef = useRef(false);
  const retryTimer = useRef(null);
  const retryDelay = useRef(2000);
  const finishedRef = useRef(false);
  const warned = useRef({ five: false, one: false });
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const clearLocal = useCallback(() => {
    localStorage.removeItem(storageKey(attemptId, "pending"));
    localStorage.removeItem(storageKey(attemptId, "flags"));
  }, [attemptId]);

  const finish = useCallback(
    (attempt) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      clearTimeout(retryTimer.current);
      clearLocal();
      onFinishedRef.current?.(attempt);
    },
    [clearLocal]
  );

  /** Kirim semua jawaban yang tertunda satu per satu. */
  const flush = useCallback(async () => {
    if (flushingRef.current || finishedRef.current) return true;
    const entries = Object.entries(pendingRef.current);
    if (entries.length === 0) return true;

    flushingRef.current = true;
    setSaveState((prev) => ({ ...prev, status: "saving" }));
    clearTimeout(retryTimer.current);

    try {
      for (const [questionId, optionId] of entries) {
        await quizApi.saveAnswer(attemptId, Number(questionId), optionId);
        // Hapus dari antrean hanya jika belum diganti siswa selama request berjalan
        if (pendingRef.current[questionId] === optionId) {
          delete pendingRef.current[questionId];
          writeJson(storageKey(attemptId, "pending"), pendingRef.current);
        }
      }
      retryDelay.current = 2000;
      setSaveState({ status: "saved", savedAt: new Date() });
      return true;
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) {
        // Waktu habis / sudah dikumpulkan di server
        const attempt = error.response.data?.data?.attempt;
        if (error.response.data?.status === "time_up") toast.warning("Waktu habis. Ujian dikumpulkan otomatis.");
        finish(attempt ?? null);
        return false;
      }
      const offline = !error.response;
      setSaveState((prev) => ({ ...prev, status: offline ? "offline" : "error" }));
      if (!offline && status === 422) {
        // Jawaban tidak valid (mis. soal diubah guru): buang dari antrean agar tidak macet
        entries.forEach(([questionId]) => delete pendingRef.current[questionId]);
        writeJson(storageKey(attemptId, "pending"), pendingRef.current);
        toast.error(getErrorMessage(error, "Jawaban tidak dapat disimpan."));
        return false;
      }
      retryTimer.current = setTimeout(() => flush(), retryDelay.current);
      retryDelay.current = Math.min(retryDelay.current * 2, 30000);
      return false;
    } finally {
      flushingRef.current = false;
      // Jika ada jawaban baru masuk selama proses, kirim lagi
      if (!finishedRef.current && Object.keys(pendingRef.current).length && retryDelay.current === 2000) {
        setTimeout(() => flush(), 0);
      }
    }
  }, [attemptId, finish]);

  const selectAnswer = useCallback(
    (questionId, optionId) => {
      if (finishedRef.current) return;
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
      pendingRef.current = { ...pendingRef.current, [questionId]: optionId };
      writeJson(storageKey(attemptId, "pending"), pendingRef.current);
      flush();
    },
    [attemptId, flush]
  );

  const toggleFlag = useCallback(
    (questionId) => {
      setFlags((prev) => {
        const next = { ...prev, [questionId]: !prev[questionId] };
        writeJson(storageKey(attemptId, "flags"), next);
        return next;
      });
    },
    [attemptId]
  );

  const submit = useCallback(
    async ({ auto = false } = {}) => {
      if (finishedRef.current || isSubmitting) return;
      setIsSubmitting(true);
      await flush();
      if (finishedRef.current) return;
      try {
        const data = await quizApi.submit(attemptId);
        if (auto) toast.info("Waktu habis. Jawaban Anda dikumpulkan otomatis.");
        else toast.success("Ujian berhasil dikumpulkan.");
        finish(data.attempt);
      } catch (error) {
        setIsSubmitting(false);
        toast.error(getErrorMessage(error, "Gagal mengumpulkan ujian. Periksa koneksi lalu coba lagi."));
        if (auto) setTimeout(() => submit({ auto: true }), 5000);
      }
    },
    [attemptId, finish, flush, isSubmitting]
  );

  // Kirim ulang jawaban tertunda dari sesi sebelumnya (mis. setelah refresh)
  useEffect(() => {
    if (Object.keys(pendingRef.current).length) flush();
    const handleOnline = () => {
      retryDelay.current = 2000;
      flush();
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearTimeout(retryTimer.current);
    };
  }, [flush]);

  // Timer
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    const tick = () => {
      const seconds = computeRemainingSeconds(deadline, clockOffset);
      setRemaining(seconds);
      if (seconds <= 300 && seconds > 60 && !warned.current.five) {
        warned.current.five = true;
        toast.warning("Waktu pengerjaan tersisa 5 menit!");
      }
      if (seconds <= 60 && seconds > 0 && !warned.current.one) {
        warned.current.one = true;
        toast.warning("Waktu tersisa 1 menit. Pastikan semua jawaban sudah dipilih.");
      }
      if (seconds <= 0 && !finishedRef.current) submitRef.current({ auto: true });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, clockOffset]);

  return {
    answers,
    flags,
    remaining,
    saveState,
    pendingCount: Object.keys(pendingRef.current).length,
    isSubmitting,
    selectAnswer,
    toggleFlag,
    submit,
  };
}
