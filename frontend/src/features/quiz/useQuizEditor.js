import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { mapServerErrors, quizEditorReducer, toPayload, validateQuiz } from "./editorModel";

/**
 * State editor ujian + validasi + penanda perubahan belum disimpan.
 * Validasi klien baru ditampilkan setelah guru pertama kali menekan Simpan.
 */
export function useQuizEditor(initialState) {
  const [state, dispatch] = useReducer(quizEditorReducer, initialState);
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const savedSnapshot = useRef(JSON.stringify(toPayload(initialState)));

  const clientErrors = useMemo(() => validateQuiz(state), [state]);
  const errors = useMemo(
    () => (showErrors ? { ...serverErrors, ...clientErrors } : serverErrors),
    [showErrors, serverErrors, clientErrors]
  );

  const payload = useMemo(() => toPayload(state), [state]);
  const isDirty = useMemo(() => JSON.stringify(payload) !== savedSnapshot.current, [payload]);

  const load = useCallback((nextState) => {
    dispatch({ type: "load", state: nextState });
    savedSnapshot.current = JSON.stringify(toPayload(nextState));
    setServerErrors({});
    setShowErrors(false);
  }, []);

  const markSaved = useCallback(() => {
    savedSnapshot.current = JSON.stringify(payload);
  }, [payload]);

  /** Jalankan validasi klien; mengembalikan daftar error (kosong = valid). */
  const validate = useCallback(() => {
    setShowErrors(true);
    setServerErrors({});
    return clientErrors;
  }, [clientErrors]);

  const applyServerErrors = useCallback((rawErrors) => {
    setServerErrors(mapServerErrors(rawErrors, state));
    setShowErrors(true);
  }, [state]);

  // Aksi yang dipakai komponen
  const actions = useMemo(
    () => ({
      setField: (field, value) => dispatch({ type: "set", field, value }),
      addQuestion: (afterUid, uid) => dispatch({ type: "add_question", afterUid, overrides: uid ? { uid } : undefined }),
      updateQuestion: (uid, patch) => dispatch({ type: "update_question", uid, patch }),
      removeQuestion: (uid) => dispatch({ type: "remove_question", uid }),
      duplicateQuestion: (uid, newUid) => dispatch({ type: "duplicate_question", uid, newUid }),
      moveQuestion: (uid, direction) => dispatch({ type: "move_question", uid, direction }),
      addOption: (questionUid) => dispatch({ type: "add_option", questionUid }),
      updateOption: (questionUid, optionUid, patch) => dispatch({ type: "update_option", questionUid, optionUid, patch }),
      removeOption: (questionUid, optionUid) => dispatch({ type: "remove_option", questionUid, optionUid }),
      setCorrect: (questionUid, optionUid) => dispatch({ type: "set_correct", questionUid, optionUid }),
    }),
    []
  );

  return { state, actions, errors, payload, isDirty, load, markSaved, validate, applyServerErrors };
}
