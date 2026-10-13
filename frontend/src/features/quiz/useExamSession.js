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
  const [remaining, setRemaining] = useState(() => computeRemainingSeconds(deadline, clockOffset));
  const [saveState, setSaveState] = useState({ status: "idle", savedAt: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingRef = useRef(readJson(storageKey(attemptId, "pending"), {}));
  /** Promise pengiriman yang sedang berjalan (null bila tidak ada). */
  const flushingRef = useRef(null);
  const retryTimer = useRef(null);
  const retryDelay = useRef(2000);
  const finishedRef = useRef(false);
  const warned = useRef({ five: false, one: false });
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const clearLocal = useCallback(() => {
    localStorage.removeItem(storageKey(attemptId, "pending"));
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

  /**
   * Kirim semua jawaban yang tertunda satu per satu. Bila pengiriman sedang berjalan,
   * promise yang sama dikembalikan agar pemanggil (mis. submit) dapat menunggunya.
   * Hasil: true bila antrean terkirim seluruhnya.
   */
  const flush = useCallback(() => {
    if (finishedRef.current) return Promise.resolve(true);
    if (flushingRef.current) return flushingRef.current;
    if (Object.keys(pendingRef.current).length === 0) return Promise.resolve(true);

    const dropPending = (questionId) => {
      delete pendingRef.current[questionId];
      writeJson(storageKey(attemptId, "pending"), pendingRef.current);
    };

    const run = (async () => {
      setSaveState((prev) => ({ ...prev, status: "saving" }));
      clearTimeout(retryTimer.current);

      for (const [questionId, optionId] of Object.entries(pendingRef.current)) {
        try {
          await quizApi.saveAnswer(attemptId, Number(questionId), optionId);
          // Hapus dari antrean hanya jika belum diganti siswa selama request berjalan
          if (pendingRef.current[questionId] === optionId) dropPending(questionId);
        } catch (error) {
          const status = error.response?.status;
          if (status === 409) {
            // Waktu habis / sudah dikumpulkan di server
            if (error.response.data?.status === "time_up") toast.warning("Waktu habis. Ujian dikumpulkan otomatis.");
            finish(error.response.data?.data?.attempt ?? null);
            return false;
          }
          if (status === 422) {
            // Jawaban tidak valid (mis. soal diubah guru): buang soal ini saja agar antrean tidak macet
            dropPending(questionId);
            toast.error(getErrorMessage(error, "Jawaban tidak dapat disimpan."));
            continue;
          }
          setSaveState((prev) => ({ ...prev, status: error.response ? "error" : "offline" }));
          retryTimer.current = setTimeout(() => flushRef.current(), retryDelay.current);
          retryDelay.current = Math.min(retryDelay.current * 2, 30000);
          return false;
        }
      }

      retryDelay.current = 2000;
      setSaveState({ status: "saved", savedAt: new Date() });
      return true;
    })().finally(() => {
      flushingRef.current = null;
      // Jika ada jawaban baru masuk selama proses, kirim lagi
      if (!finishedRef.current && Object.keys(pendingRef.current).length && retryDelay.current === 2000) {
        setTimeout(() => flushRef.current(), 0);
      }
    });

    flushingRef.current = run;
    return run;
  }, [attemptId, finish]);

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  /** Tunggu sampai seluruh antrean terkirim, termasuk jawaban yang masuk saat pengiriman berjalan. */
  const flushAll = useCallback(async () => {
    let ok = await flush();
    while (ok && !finishedRef.current && Object.keys(pendingRef.current).length) {
      ok = await flush();
    }
    return ok;
  }, [flush]);

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

  const submittingRef = useRef(false);
  /** Waktu paling awal percobaan auto-submit berikutnya (jeda saat gagal). */
  const nextAutoSubmitAt = useRef(0);

  const submit = useCallback(
    async ({ auto = false } = {}) => {
      if (finishedRef.current || submittingRef.current) return;
      submittingRef.current = true;
      setIsSubmitting(true);

      const fail = (message) => {
        submittingRef.current = false;
        setIsSubmitting(false);
        toast.error(message);
        if (auto) nextAutoSubmitAt.current = Date.now() + 5000;
      };

      // Pastikan semua jawaban sudah tersimpan di server sebelum dinilai.
      // Saat waktu habis tetap dikumpulkan; server menilai jawaban yang sudah diterima.
      const saved = await flushAll();
      if (finishedRef.current) return;
      if (!saved && !auto) {
        fail("Sebagian jawaban belum tersimpan. Periksa koneksi lalu kumpulkan lagi.");
        return;
      }

      try {
        const data = await quizApi.submit(attemptId);
        if (auto) toast.info("Waktu habis. Jawaban Anda dikumpulkan otomatis.");
        else toast.success("Ujian berhasil dikumpulkan.");
        finish(data.attempt);
      } catch (error) {
        fail(getErrorMessage(error, "Gagal mengumpulkan ujian. Periksa koneksi lalu coba lagi."));
      }
    },
    [attemptId, finish, flushAll]
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
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);
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
      if (seconds <= 0 && !finishedRef.current && Date.now() >= nextAutoSubmitAt.current) {
        submitRef.current({ auto: true });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, clockOffset]);

  return {
    answers,
    remaining,
    saveState,
    isSubmitting,
    selectAnswer,
    submit,
  };
}
