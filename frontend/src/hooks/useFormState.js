import { useCallback, useState } from "react";

/**
 * State form sederhana + error per field.
 * `bind(field)` → props value/onChange untuk input; error field dihapus saat diubah.
 */
export function useFormState(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const setValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const bind = (field) => ({
    value: values[field] ?? "",
    onChange: (e) => setValue(field, e.target.value),
  });

  return { values, setValue, bind, errors, setErrors };
}

/** Props aksesibilitas untuk kontrol form: id + aria-invalid + aria-describedby ke pesan error Field. */
export function controlProps(id, error) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}
