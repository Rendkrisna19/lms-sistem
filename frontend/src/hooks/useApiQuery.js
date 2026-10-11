import { useCallback, useEffect, useRef, useState } from "react";
import { api, getErrorMessage, isCanceled } from "../lib/api";

/**
 * Ambil data GET dari API dengan status loading / error, dukungan reload,
 * dan pembatalan request lama (mencegah respons lama menimpa data baru).
 *
 * @param {string|null} url  null = jangan fetch
 * @param {object} options   { params, select: (body) => data, enabled }
 */
export function useApiQuery(url, { params, select, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(url && enabled));
  const [reloadKey, setReloadKey] = useState(0);

  // Simpan selector di ref agar fungsi inline tidak memicu fetch ulang
  const selectRef = useRef(select);
  selectRef.current = select;
  const paramsKey = JSON.stringify(params ?? {});

  useEffect(() => {
    if (!url || !enabled) {
      setIsLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    api
      .get(url, { params: JSON.parse(paramsKey), signal: controller.signal })
      .then((res) => {
        const body = res.data;
        setData(selectRef.current ? selectRef.current(body) : body?.data ?? body);
      })
      .catch((err) => {
        if (isCanceled(err)) return;
        setError(getErrorMessage(err, "Gagal memuat data dari server."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [url, paramsKey, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, setData, error, isLoading, reload };
}
